import Mentor from "../models/Mentor.js";

export const addMentor = async (req, res) => {
  try {
    const { firstName, lastName, profileLink, communication, organization, location, experience, expertise, linkedin, instagram, twitter } = req.body;
    const user_id = req.userId;

    if (!firstName || !lastName)
      return res.status(400).json({ error: "First and last name required" });

    const mentor = await Mentor.create({
      first_name: firstName,
      last_name: lastName,
      user_id,
      profile_link: profileLink,
      communication: Array.isArray(communication) ? communication : [communication].filter(Boolean),
      organization,
      location,
      experience: parseInt(experience) || 0,
      expertise,
      linkedin,
      instagram,
      twitter,
    });

    res.status(201).json({ success: true, mentor: { ...mentor.toObject(), id: mentor._id } });
  } catch (err) {
    console.error("Add Mentor Error:", err);
    res.status(500).json({ error: "Failed to save mentor" });
  }
};

export const getAllMentors = async (req, res) => {
  const { expertise, search } = req.query;
  try {
    const query = {};
    if (expertise) query.expertise = { $regex: expertise, $options: "i" };
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } },
        { expertise: { $regex: search, $options: "i" } },
      ];
    }

    const mentors = await Mentor.find(query).sort({ createdAt: -1 });
    res.json(mentors.map((m) => ({ ...m.toObject(), id: m._id })));
  } catch (err) {
    console.error("Get Mentors Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
