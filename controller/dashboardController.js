const Artist = require("../model/Artist");
const Category = require("../model/ArtCategory");
const Event = require("../model/Event");
const Contribute = require("../model/Contribute");
const Application = require("../model/Application");
const EventApplication = require("../model/EventApplication");

const getDashboardCounts = async (req, res) => {
  try {
    const [artistCount, categories, eventCount, contributionCount, artFormApplicationCount,eventApplicationCount] =
      await Promise.all([
        Artist.countDocuments(),
        Category.find({}, { artTypes: 1 }),
        Event.countDocuments(),
        Contribute.countDocuments(),
        Application.countDocuments(),
        EventApplication.countDocuments() 
      ]);

    // count embedded artTypes
    const artTypeCount = categories.reduce(
      (sum, cat) => sum + (cat.artTypes?.length || 0),
      0
    );

    res.json({
      success: true,
      artists: artistCount,
      categories: categories.length,
      artTypes: artTypeCount,
      events: eventCount,
      contributions: contributionCount,
      applications: {
        artForms: artFormApplicationCount,
        events: eventApplicationCount
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load dashboard data" });
  }
};

module.exports = { getDashboardCounts };
