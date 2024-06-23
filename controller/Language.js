const { Language } = require("../model/Language")

exports.fetchLanguage = async (req,res)=>{

    try{
         const language = await Language.find({}).exec();
         res.status(200).json(language);
    }
    catch(err){
        res.status(400).json(err);
    }
}

exports.createLanguage = async(req,res)=>{
    const language = new Language(req.body);
    try{
        const doc = await language.save();
        res.status(201).json(doc);
    }
     catch(err){
     res.status(400).json(err);
     }
}
