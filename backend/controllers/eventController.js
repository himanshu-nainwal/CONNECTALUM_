import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

export const getEvents = async (req, res) => {
  const { search, department } = req.query;
  try {
    const query = {};
    if (department) query.department = { $regex: department, $options: "i" };
    if (search) query.title = { $regex: search, $options: "i" };

    const events = await Event.find(query).sort({ createdAt: -1 });
    res.json(events.map((e) => ({ ...e.toObject(), id: e._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ ...event.toObject(), id: event._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createEvent = async (req, res) => {
  const { title, department, location, tags, price, registrationDaysLeft, description, speakers, meetingLink, eventDate } = req.body;
  const posted_by = req.userId;

  try {
    const event = await Event.create({
      title,
      department,
      location,
      updated_on: eventDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      tags: Array.isArray(tags) ? tags : tags?.split(",").map((t) => t.trim()).filter(Boolean) || [],
      price: parseFloat(price) || 0,
      registration_days_left: parseInt(registrationDaysLeft) || 30,
      description,
      speakers: Array.isArray(speakers) ? speakers : speakers?.split(",").map((s) => s.trim()).filter(Boolean) || [],
      meeting_link: meetingLink || "",
      posted_by,
    });

    res.status(201).json({ success: true, event: { ...event.toObject(), id: event._id } });
  } catch (err) {
    console.error("Create Event Error:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
};

export const registerForEvent = async (req, res) => {
  const { eventId } = req.body;
  const studentId = req.userId;

  try {
    const existing = await Registration.findOne({ event_id: eventId, student_id: studentId });
    if (existing) return res.status(409).json({ message: "Already registered" });

    const registration = await Registration.create({ event_id: eventId, student_id: studentId });
    res.status(201).json({ success: true, registration: { ...registration.toObject(), id: registration._id } });
  } catch (err) {
    console.error("Register Event Error:", err);
    res.status(500).json({ error: "Failed to register" });
  }
};
