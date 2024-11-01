const { Language } = require("../model/Language");
const { redis } = require("../utils/features");

exports.fetchLanguage = async (req, res) => {

    try {

        let language;

        language = await redis.get("languages");

        if (language)
            language = JSON.parse(language);
        else{
        language = await Language.find({}).exec();
        redis.set("languages", JSON.stringify(language));
        redis.expire("languages", 30);
        }
        res.status(200).json(language);
    }
    catch (err) {
        res.status(400).json(err);
    }
}

exports.createLanguage = async (req, res) => {
    const language = new Language(req.body);
    try {
        const doc = await language.save();
        res.status(201).json(doc);
    }
    catch (err) {
        res.status(400).json(err);
    }
}
