const express = require("express");
const router = express.Router();
const surveyModel = require('../models/survey.models')
const { hashPassword } = require('../helper/hashPass.helper')
const { myMulter } = require('../middleware/upload');
const config = require('../../config')
const auth = require('../middleware/auth')
var jwt = require('jsonwebtoken');
const surveyReaderModel = require("../models/surveyReader.model");
const Question = require("../models/questions.models");
const Answer = require("../models/answers.model")
const QuestionController = require('../models/questions_controller.models')
const Location = require("../../src/models/location.models");
const questionsModels = require("../models/questions.models");
const Response = require("../models/response.model")
const mongoose = require('mongoose');
const userModels = require("../models/user.models");
const notifyModels = require("../models/notify.models");
const companyModels = require("../models/company.models");
require('dotenv').config()

// router.get('${process.env.BASE_URL}/getNotifyData', auth, async (req, res) => {
//     try {
//         let role = req.user.user_role;
//         if (role === "admin") {
//             // Find surveys created by the logged-in user
//             let surveys = await surveyModel.find({ created_by: req.user._id, active: 1 })
//                 .select('survey_title');

//             // Find survey readers created by the logged-in user
//             let surveyReaders = await userModels.find({ department_id: req.user.department_id,user_role:"survey-reader" })
//             .select('user_name ');

//             let locations = await Location.find({ department_id: req.user.department_id, active: 1 })
//                 .populate({
//                     path: 'survey_id',
//                     model: 'survey',
//                     select: 'created_by survey_title',
//                 })
//                 .select('_id created_by location_name');

//             locations = locations.filter(location => location.survey_id.created_by.toString() === req.user._id.toString());

//             const locationData = locations.map(location => ({
//                 location_id: location._id,
//                 location_name: location.location_name,
//             }));

//             // Correct the model from Location to Question for the questions query
//             let questions = await Question.find({ survey_id: { $in: surveys.map(survey => survey._id) } })
//                 .select('_id question_title');

//             // Retrieve answers associated with the questions
//             let answers = await Answer.find({ question_id: { $in: questions.map(question => question._id) } })
//                 .select('_id answer');
//                 let data ={
//                     surveys:surveys,
//                     surveyReaders:surveyReaders,
//                     locationData:locationData,
//                     questions:questions,
//                     answers:answers
//                 }
//                 res.json({message:data,type:2});
//         } else {
//             res.status(200).json({ message: "Sorry, you are unauthorized" });
//         }
//     } catch (error) {
//         res.json({ message: "Catch error " + error });
//     }
// });

router.get(`${process.env.BASE_URL}/getReaderBySurvey`, auth, async (req, res) => {
    try {
        let survey_id = req.headers['survey_id'];
        let role = req.user.user_role;

        if (role == "admin") {
            let existingSurvey = await surveyModel.findOne({_id:survey_id,active:1})
            if(existingSurvey){
                let readers = await surveyReaderModel.find({ survey_id: survey_id, active: 1 })
                .populate({
                    path: 'reader_id',
                    model: 'user',
                    select: 'user_name _id', // Specify the fields you want to select
                });

            // Extract only the necessary fields
            let formattedReaders = readers.map(reader => ({
                user_id: reader.reader_id._id,
                user_name: reader.reader_id.user_name,
            }));
             if(formattedReaders.length>0){
                res.json({message:formattedReaders,type:2});
             }
            else{
                res.json({message:"No data found",type:0});
            }
            }
            else{
                res.json({ message: "The survey you are looking for does not exist", type: 0 });
            }
         
        } else {
            res.json({ message: "Sorry, you are unauthorized",type:0 });
        }
    } catch (error) {
        res.json({ message: "Catch error " + error });
    }
});


router.post(`${process.env.BASE_URL}/addNotifier`, auth, async (req, res) => {
    try {
        let role = req.user.user_role;
        let created_by = req.user._id
        let { survey_id, location_id, surveyReaders_id, question_id, answer_id,answer_text } = req.body;
        let existLocation;
        let  existAnswer;
        let company_id = req.user.company_id
        let companyAccess = await companyModels.findOne({_id:company_id ,active:1,notifier:1})
        if(companyAccess){
            if (role == "admin") {
                // Check if the survey, location, question, and answer exist and are active
                let existSurvey = await surveyModel.findOne({ _id: survey_id, active: 1 });
                if(location_id){
                     existLocation = await Location.findOne({ _id: location_id, active: 1 });
                }
                
                let existQuestion = await Question.findOne({ _id: question_id, active: 1 });
                if(answer_id){
                    existAnswer = await Answer.findOne({ _id: answer_id, active: 1 });
                }
              
    
                // Check if all survey reader ids exist and are active
                let existReaders = await surveyReaderModel.findOne({ reader_id: surveyReaders_id, active: 1 });
                let readerData = await userModels.findOne({_id:surveyReaders_id, active : 1}).select('email_address user_name -_id')
                if (existSurvey && existQuestion && existReaders) {
                    // Save data in the notify table
                    
                    const notifyData = {
                        location_id: location_id?existLocation._id:null,
                        survey_id: existSurvey._id,
                        question_id: existQuestion._id,
                        answer_id: answer_id ?existAnswer._id:null ,
                        answer_text : (answer_id && answer_text)?existAnswer.answer:answer_text,
                        survey_reader_id: surveyReaders_id,
                        created_by,
                        reader_email:readerData.email_address,
                        reader_name:readerData.user_name
    
                    };
                    const notifyEntry = await notifyModels.create(notifyData);
                    res.json({ message: "Data saved successfully",type:1});
                } else {
                    res.json({ message: "One or more entities do not exist or are inactive" ,type:0});
                }
            } else {
                res.status(200).json({ message: "Sorry, you are unauthorized",type:0 });
            }
        }
        else{
            res.json({ message: "Apologies, but your company currently lacks the necessary access for this operation.", type: 0 });
        }
    } catch (error) {
        res.json({ message: "Catch error: " + error });
    }
});

router.get(`${process.env.BASE_URL}/getNotifies`, auth, async (req, res) => {
    try {
        let role = req.user.user_role;
        let company_id = req.user.company_id
        let companyAccess = await companyModels.findOne({_id:company_id , active:1,notifier:1})
        if(companyAccess){
            if (role === 'admin') {
                let notifiers = await notifyModels.find({
                    created_by: req.user._id,
                    active:1
                }).populate([
                    {
                        path: 'survey_reader_id',
                        select: 'user_name -_id',
                    },
                    {
                        path: 'survey_id',
                        select: 'survey_title',
                    },
                    {
                        path: 'question_id',
                        select: 'question_title',
                    },
                    {
                        path: 'location_id',
                        select: 'location_name',
                    }
                ]);
    
                if (notifiers.length > 0) {
                    const flattenedNotifiers = notifiers.map(notifier => ({
                        _id: notifier._id,
                        active: notifier.active,
                        location_name: notifier.location_id ? notifier.location_id.location_name : null,
                        survey_title: notifier.survey_id ? notifier.survey_id.survey_title : null,
                        question_title: notifier.question_id ? notifier.question_id.question_title : null,
                        answer_text: notifier.answer_text,
                        survey_reader_name: notifier.survey_reader_id ? notifier.survey_reader_id.user_name : null,
                    }));
                    res.json({message:flattenedNotifiers,type:2});
                } else {
                    res.json({ message: "No data found" ,type:0});
                }
            } else {
                res.status(200).json({ message: "Sorry, you are unauthorized",type:0 });
            }
        }
        else{
            res.json({ message: "Apologies, but your company currently lacks the necessary access for this operation.", type: 0 });
        }
    } catch (error) {
        res.json({ message: "Catch error " + error });
    }
});

router.put(`${process.env.BASE_URL}/activeAndInactiveNotify`,auth,async(req,res)=>{
    try {
        let id = req.headers['notifier_id']
        let role = req.user.user_role
        let user_id = req.user._id
        let {active} = req.body
        if(role == 'admin'){
          
            let notifier = await notifyModels.findOne({_id:id})
            if(notifier){
                notifier = await notifyModels.updateOne({_id:id},{active:active})
                if(active==0){
                    res.json({message:"The data deleted successfully",type:1})
                }
                else{
                    res.json({message:"The data activated successfully",type:1})
                }
            }
            else{
                res.json({message:"No data found",type:0})
            }
        }
        else{
            res.json({message:"sorry, you are unauthorized",type:0})
        }
    } catch (error) {
            res.json({message:"catch error "+error})
    }
})

module.exports = router