import express from "express";
const router = express.Router();

router.get("/rooms", (req, res) => {
  res.json([
    { id: "general", name: "General", description: "General discussions" },
    { id: "jobs", name: "Jobs & Careers", description: "Job opportunities and career advice" },
    { id: "tech", name: "Tech Talk", description: "Technical discussions" },
    { id: "events", name: "Events", description: "Event announcements and discussions" },
  ]);
});

export default router;
