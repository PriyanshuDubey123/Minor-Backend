const { Category } = require("../model/Category");
const { redis } = require("../utils/features");


exports.fetchCategories = async (req, res) => {

    try {
        let categories;

        categories = await redis.get("categories");

        if (categories)
            categories = JSON.parse(categories);
        else {
            categories = await Category.find({}).exec();
            redis.set("categories", JSON.stringify(categories));
            redis.expire("categories", 30);
        }
        res.status(200).json(categories);
    }
    catch (err) {
        res.status(400).json(err);
    }
}

exports.createCategory = async (req, res) => {
    const category = new Category(req.body);
    try {
        const doc = await category.save();
        res.status(201).json(doc);
    }
    catch (err) {
        res.status(400).json(err);
    }
}
