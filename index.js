require('dotenv').config()
const cors = require('cors')
const express = require('express')
const connectDB = require('./src/database/db')
const loginRouter = require('./src/router/login.router')
const userRouter = require('./src/router/user.router')
const companyRouter = require('./src/router/company.router')
const departmentRouter = require('./src/router/department.router')
const surveyRouter = require('./src/router/survey.router')
const questionRouter = require('./src/router/question.router')
const locationRouter = require('./src/router/location.router')
const imageRouter = require('./src/router/image.router')
const settingRouter = require('./src/router/setting.router')
const questionControllerRouter = require('./src/router/questions_controller.router')
const app = express()
app.use(cors())
app.use(express.static("logo"));
app.use(express.json());


const port = parseInt(process.env.PORT)
connectDB()

app.use(userRouter)
app.use(loginRouter)
app.use(companyRouter)
app.use(departmentRouter)
app.use(surveyRouter)
app.use(questionRouter)
app.use(locationRouter)
app.use(imageRouter)
app.use(settingRouter)
app.use(questionControllerRouter)
app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))