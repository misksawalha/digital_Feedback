const { Schema, model } = require('mongoose')

const responseSchema = new Schema({
    active: {
         type: Number,
         default: 1
     },

     question_id: {
         type: Schema.Types.ObjectId,
         ref: 'question'
     },
     survey_id: {
         type: Schema.Types.ObjectId,
         ref: 'survey'
     },
     location_id: {
         type: Schema.Types.ObjectId,
         ref: 'location'
     },
     question_type: {
         type: Schema.Types.ObjectId,
         ref: 'question_controller'
     },
     user_answer: {
         type: String
     },
     user_id : {
        type: Schema.Types.ObjectId,
     },
     answer_id:{
        type: Schema.Types.ObjectId,
        ref: 'answer'
     },
     response_flag:{
        type:Number,
        default:0
     },
     department_id:{
        type: Schema.Types.ObjectId,
        ref: 'department'
     },
     company_id:{
        type: Schema.Types.ObjectId,
        ref: 'company'
     },
     question_type:{
        type:String
     },
     user_number:{
        type:String
     }
 }, { timestamps: true });

 
 module.exports = model('response', responseSchema);