const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({ //menerima 2 object
    description : {
        type : String,
        required : true,
        trim: true
    },
    completed : {
        type : Boolean,
        default: false
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : 'User' //refer ke table user di database
    }
},{
    timestamps : true //membauat field createdAt, editedAt (mencatat kapan dibikin dan kapan diedit)
})

const Task = mongoose.model('Task', taskSchema)
module.exports = Task