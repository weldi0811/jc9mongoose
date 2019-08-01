const express = require('express')
const mongoose = require('mongoose')
const User = require('./models/user')
const Task = require('./models/task')
const multer = require('multer')
const sharp = require('sharp')
const cors = require('cors')

mongoose.connect('mongodb+srv://weldi9:weldi123@weldicluster-ctyjg.mongodb.net/weldi9?retryWrites=true&w=majority', {

    //mongodb+srv://weldi9:weldi123@weldicluster-ctyjg.mongodb.net/weldi9?retryWrites=true&w=majority
    //parser string url
    useNewUrlParser : true,
    useCreateIndex: true
})

const app = express()
const port = process.env.PORT || 2019

app.use(express.json())
app.use(cors())

app.get('/', (req,res) => {
    res.send ('<h1>sukses bray</h1>')
})


 //refactoring asyincronus  ADD USERS
app.post('/users/input',  async (req,res)=> {
    try {
    
    const {name, email, age, password} = req.body

    const data_name = name
    const data_email = email
    const data_age = age
    const data_password = password

    const person = new User ({
        name : data_name,
        age : data_age,
        email : data_email,
        password : data_password
    })

    var inputperson = await person.save()
    res.send('sukses')
        
    } catch (error) {
        res.send(error)
        
    }
})

//create avatar
const upload = multer({
    limits : {
        fileSize : 1000000 //byte
    },
    fileFilter(req,file,cb){ //request, file, callback
        var boleh = file.originalname.match(/\.(jpg|jpeg|png|gif)$/)

        if(!boleh){
            cb(new Error('MASUKIN YANG BENER'))
        }

        cb(undefined, true)
    }
})
app.post('/users/:id/avatar',upload.single('avatar'),(req,res) => {
    const data_id = req.params.id

    sharp (req.file.buffer).resize({width : 250}).png().toBuffer()
    .then(buffer => {
        User.findById(data_id).then(user => { //simpan buffer di property avatar milik user
            user.avatar = buffer

            //simpan user
            user.save().then(()=>{
                res.send('upload berhasil')
            })
        })
    })

})

//READ AVATAR
app.get('/users/:id/avatar', async (req, res) => {
    // get user, kirim foto
    const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
        throw new Error('Foto / User tidak ada')
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar) // default: ContentType : application/json
})




app.get('/users', (req,res) => {
    User.find().then(result => { res.send(result)})
})


//read one user by id
app.get('/users/:id', (req,res) => {
    const data_id = req.params.id

    User.findById(data_id)
    .then(result => {
        res.send(result)
    })
})

//update name by id

app.patch('/users/:id', upload.single('avatar') ,(req, res) => {
    let arrayBody = Object.keys(req.body)

    //req body yang lengkap
    arrayBody.forEach(key => {
        if(!req.body[key]){
            delete req.body[key]
        }
    })

    //req body setelah di proses foreach

    let arrayBody2 = Object.keys(req.body)

    const data_id = req.params.id

    User.findById(data_id)
        .then(user => {
            // user : {_id, name, password, email, age}

            if(!user){
                return res.send("User tidak di temukan")
            }

            arrayBody2.forEach(key => {
                user[key] = req.body[key]
            })

            sharp(req.file.buffer).resize({width: 250}).png().toBuffer()
            .then(buffer => {

                user.avatar = buffer

                user.save()
                    .then(() => {
                        res.send('Update Profile Berhasil')
                    })

            })
            

            
        })
})

//delete by id

app.delete('/users/:id', (req,res) => {
    const data_id = req.params.id
    User.findByIdAndRemove(data_id).then(result => {
        res.send('berhasil dihapus')
    })
})


//create one task
app.post('/task/:userid', async (req,res) => {
    const data_desc = req.body.description
    const data_id = req.params.userid

    var finduser = await User.findById(data_id)
    if(!finduser){
        res.send(new Error('unable to create task'))
    }

    const task = Task({
        description : data_desc,
        owner : data_id
    })

    finduser.tasks = finduser.tasks.concat(task._id)


    await finduser.save()
    await task.save()

    res.send({
        message : "sukses update",
        finduser,
        task
    })

    //masukkan id dari task yang sudah dibuat ke array 'tasks'

})

//read task by user id

app.get('/task/:userid', async (req,res) => {

    const data_id = req.params.userid
    var finduser = await User.findById(data_id).populate({
        path: 'tasks',
        options: {
            // sorting data secara descending berdasarkan field completed
            // 1 = Ascending : false -> true
            // -1 = Descending : true -> false
            sort: {
                completed: 1
            }
        }
    }).exec()
    if(!finduser){
        res.send('unable to read tasks')
    }
    res.send(finduser)
})

//update task by taskid dan userid

app.patch('/task/:userid/:taskid', async (req,res) => {
    const data_userid = req.params.userid
    const task_id = req.params.taskid

    var finduserid = await User.findById(data_userid)
        if(!finduserid){
            return res.send('user tidak ditemukan')
        }

    var findtaskid = await Task.findOne({_id: task_id})
    if(!findtaskid){
        return res.send('task tidak ditemukan')
    }
    findtaskid.completed= !findtaskid.completed 

    await findtaskid.save()
    res.send('selesai dikerjkan')

})

//delete task by taskid dan userid
app.delete('/users/:userid/:taskid', async (req,res) => {
    const data_userid = req.params.userid
    const data_taskid = req.params.taskid

    var findUser = await User.findById(data_userid)

    if(!findUser) {
        return res.send('User tidak ditemukan')
    }

    var findTask = await Task.findByIdAndDelete(data_taskid)

    if(!findTask) {
        return res.send('Task tidak ditemukan')
    }

    await findTask.save()
    res.send(findTask)
    // res.send( ` '${findTask.description}' Task berhasil di delete`)
})

//update one task by id

app.patch('/task/:id', (req,res) => {
    const data_id = req.params.id

    Task.findById(data_id).then(task => {
        //task berisi property {description, compoleted}

        task.completed = true

        task.save().then(task => {
            res.send(task)
        })
    })
})

app.delete('/tasks/:id', (req, res) => {
    const data_id = req.params.id

    Task.findByIdAndDelete(data_id)
        .then(task => {
            res.send(task)
        })
})

//login user

app.post('/users/login', async (req,res) => {
    const data_email = req.body.email
    const data_pass = req.body.password


    try {
        const hasil = await User.loginWithEmail(data_email,data_pass)
        res.send(hasil)
    } catch (error) {
        console.log(error)
    }
    
})



app.listen(port,() => {
    console.log('sukses di port ' +port)
})