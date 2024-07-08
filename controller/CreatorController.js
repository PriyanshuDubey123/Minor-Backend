const Creator = require("../model/CreatorModal");
const individualCreatorAnalytics = require("../model/IndividualCreatorAnalytics");
const LiveCourses = require("../model/LiveCourses");
const { User } = require("../model/User");

exports.becomeCreator = async (req, res) => {
  try {

    const { id } = req.params;


    await User.findByIdAndUpdate(id, { isCreator: true });

    const creator = new Creator({ ...req.body, userId: id });

    await creator.save();

    res.status(201).json({ message: 'Created successfully', creator: creator });
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
}

exports.fetchCourseByCreatorId = async (req, res) => {
  try {
    const { filters } = req.query;

    const { _id } = await Creator.findOne({ userId: req.params.id });

    const courses = await LiveCourses.find({ creatorId: _id });

    let filteredCourses = courses;


    if (filters) {

      if (filters.includes('Free')) {
        filteredCourses = filteredCourses.filter(course => course.price === 0);
      }
      if (filters.includes('Price > 1000')) {
        filteredCourses = filteredCourses.filter(course => course.price > 1000);
      }
      if (filters.includes('Price > 5000')) {
        filteredCourses = filteredCourses.filter(course => course.price > 5000);
      }
      if (filters.includes('Price < 500')) {
        filteredCourses = filteredCourses.filter(course => course.price < 500);
      }
      if (filters.includes('Price < 1000')) {
        filteredCourses = filteredCourses.filter(course => course.price < 1000);
      }
      if (filters.includes('Most Popular')) {
        filteredCourses = filteredCourses.sort((a, b) => b.popularity - a.popularity);
      }
      if (filters.includes('Most Profitable')) {
        filteredCourses = filteredCourses.sort((a, b) => b.revenue - a.revenue);
      }
      if (filters.includes('Latest')) {
        filteredCourses = filteredCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }
    const publishedCourses = filteredCourses.filter(course => course.isPublished);
    const underReviewCourses = filteredCourses.filter(course => course.underReview);
    const pendingCourses = filteredCourses.filter(course => !course.isPublished && !course.underReview);

    const individualCreatorAnalytic = await individualCreatorAnalytics.findOne({ creatorId: _id });
    const totalSales = individualCreatorAnalytic?.totalSales ||0;
    const totalRevenue = individualCreatorAnalytic?.totalRevenue || 0;

    let sales = 0;
    let revenue = 0;

    const { month } = req.query;

    if (month) {
      let filteredAnalytics = individualCreatorAnalytic?.dateWiseAnalytics;

    if(filteredAnalytics){

      filteredAnalytics = filteredAnalytics.filter(analytic => {
        const analyticMonth = new Date(analytic.date).toISOString().substring(0, 7);
        console.log(new Date(analytic.date).toISOString().substring(0, 7))
        return analyticMonth === month;
      });
      sales = filteredAnalytics.reduce((acc, curr) => acc + curr.totalSales, 0);
      revenue = filteredAnalytics.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    }
  }

    res.json({ publishedCourses, underReviewCourses, pendingCourses, totalSales, totalRevenue, sales, revenue });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
}