import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import { sendEventReminderEmail } from "../services/emailService.js";

// -------------------------------------------------------------
// Get Events with Department / Search Filter
// -------------------------------------------------------------
export const getEvents = async (req, res) => {
  const { search, department, batch } = req.query;
  try {
    const query = {};
    if (department && department !== "all") query.department = { $regex: department, $options: "i" };
    if (batch) query.allowed_batches = { $in: [parseInt(batch)] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const events = await Event.find(query).sort({ createdAt: -1 });
    res.json(events.map((e) => ({ ...e.toObject(), id: e._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------
// Get Event By ID
// -------------------------------------------------------------
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("posted_by", "name email company");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ ...event.toObject(), id: event._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------------
// Create Event with Eligibility, Calendar Date & Archives
// -------------------------------------------------------------
export const createEvent = async (req, res) => {
  const {
    title,
    department,
    location,
    tags,
    price,
    registrationDaysLeft,
    description,
    speakers,
    meetingLink,
    eventDate,
    allowedBatches,
    allowedDepartments,
    recordingUrl,
    slidesUrl,
  } = req.body;
  const posted_by = req.userId;

  try {
    const event = await Event.create({
      title,
      department,
      location: location || "Campus Auditorium / Google Meet",
      updated_on: eventDate ? new Date(eventDate).toLocaleDateString() : new Date().toLocaleDateString(),
      event_date: eventDate ? new Date(eventDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: Array.isArray(tags) ? tags : (tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      price: parseFloat(price) || 0,
      registration_days_left: parseInt(registrationDaysLeft) || 14,
      description,
      speakers: Array.isArray(speakers) ? speakers : (speakers || "").split(",").map((s) => s.trim()).filter(Boolean),
      meeting_link: meetingLink || "",
      allowed_batches: Array.isArray(allowedBatches)
        ? allowedBatches.map(Number)
        : (allowedBatches || "").toString().split(",").map((b) => parseInt(b.trim())).filter(Boolean),
      allowed_departments: Array.isArray(allowedDepartments)
        ? allowedDepartments
        : (allowedDepartments || "").split(",").map((d) => d.trim()).filter(Boolean),
      recording_url: recordingUrl || "",
      slides_url: slidesUrl || "",
      posted_by,
    });

    res.status(201).json({ success: true, event: { ...event.toObject(), id: event._id } });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
};

// -------------------------------------------------------------
// Register / RSVP for Event with Department & Batch Restrictions
// -------------------------------------------------------------
export const registerForEvent = async (req, res) => {
  const { eventId } = req.body;
  const studentId = req.userId;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const student = await User.findById(studentId);

    // Validate restrictions
    if (event.allowed_batches && event.allowed_batches.length > 0 && student?.batch) {
      if (!event.allowed_batches.includes(student.batch)) {
        return res.status(403).json({
          message: `This event is restricted to batches [${event.allowed_batches.join(", ")}]. Your batch is ${student.batch}.`,
        });
      }
    }

    if (event.allowed_departments && event.allowed_departments.length > 0 && student?.department) {
      const matchDept = event.allowed_departments.some((d) =>
        student.department.toLowerCase().includes(d.toLowerCase())
      );
      if (!matchDept) {
        return res.status(403).json({
          message: `This event is restricted to departments [${event.allowed_departments.join(", ")}].`,
        });
      }
    }

    const existing = await Registration.findOne({ event_id: eventId, student_id: studentId });
    if (existing) return res.status(409).json({ message: "Already registered for this event" });

    const ticketId = `TKT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const registration = await Registration.create({
      event_id: eventId,
      student_id: studentId,
      ticket_id: ticketId,
      status: "confirmed",
    });

    res.status(201).json({
      success: true,
      ticketId,
      registration: { ...registration.toObject(), id: registration._id },
      message: "RSVP confirmed! Ticket generated.",
    });
  } catch (err) {
    console.error("Register Event Error:", err);
    res.status(500).json({ error: "Failed to register" });
  }
};

// -------------------------------------------------------------
// Get Student's Event Tickets
// -------------------------------------------------------------
export const getMyTickets = async (req, res) => {
  try {
    const registrations = await Registration.find({ student_id: req.userId })
      .populate("event_id")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets: registrations.map((r) => ({
        ...r.toObject(),
        id: r._id,
        event: r.event_id,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// -------------------------------------------------------------
// Module 11: Generate Google Calendar (.ics) File
// -------------------------------------------------------------
export const getEventCalendarIcs = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    const startDate = event.event_date || new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

    const formatDateIcs = (d) => {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ConnectAlum Platform//Alumni Events Hub//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:connectalum-${event._id}@connectalum.edu`,
      `DTSTAMP:${formatDateIcs(new Date())}`,
      `DTSTART:${formatDateIcs(startDate)}`,
      `DTEND:${formatDateIcs(endDate)}`,
      `SUMMARY:${event.title.replace(/[,;]/g, " ")}`,
      `DESCRIPTION:${(event.description || "Alumni-Student session on ConnectAlum").replace(/[\r\n]+/g, " ")}`,
      `LOCATION:${(event.location || event.meeting_link || "Online").replace(/[,;]/g, " ")}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="event-${event._id}.ics"`);
    res.send(icsContent);
  } catch (err) {
    res.status(500).send("Calendar export error");
  }
};

// -------------------------------------------------------------
// Module 11: Trigger Email Reminders (Simulation)
// -------------------------------------------------------------
export const sendEventReminders = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const registrations = await Registration.find({ event_id: id }).populate("student_id", "email name");

    let sentCount = 0;
    for (const reg of registrations) {
      if (reg.student_id?.email) {
        await sendEventReminderEmail(
          reg.student_id.email,
          reg.student_id.name,
          event.title,
          event.updated_on || new Date(event.event_date).toLocaleString(),
          event.meeting_link
        );
        sentCount++;
      }
    }

    res.json({
      success: true,
      message: `Sent reminders to ${sentCount} registered students!`,
      sentCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to dispatch reminders" });
  }
};
