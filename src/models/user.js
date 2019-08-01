const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')


const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true, //wajib diisi user
        trim : true //menghapus whitespace di depan dan belakang data
    },
    email : {
        type : String,
        required : true,
        trim : true,
        lowercase : true,
        index : {
            unique : true
        },
        validate(value){
            var check = validator.contains(value, ' ') 
            var hasil = validator.isEmail(value)

            if(!hasil){
                throw new Error('BUKAN EMAIL')
            }
            if(check){
                throw new Error('MENGANDUNG SPASI')
            }
        }
    },
    password : {
        minlength : 7,
        trim : true,
        type : String,

        validate(value){
            var hasil = validator.contains(value, ' ')
            var check = validator.contains(value.toLowerCase(), 'password')

            if(hasil){
                throw new Error('mengandung spasi')
            }
            if(check){
                throw new Error('kegampangan')
            }
        }
        
        
        
    },
    age : {
        default : 0,
        min : 1,
        max : 100,
        require : true,
        type : Number,
        validate(value){
            if(value === null){
                throw new Error('tidak boleh string kosong')
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tasks : [{type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
    }]
})


//membuat model method
userSchema.statics.loginWithEmail =  async (data_email,data_password) => {
        try {
            var findemail = await User.findOne({email : data_email})
                if(!findemail){
                throw new Error ('unable to login')
            }

    //data_password itu adalah inputan user. user.password itu password yang tersimpan dalam database
    //bcrypt.compare itu ngebikin find.password balik ke bentuk sebelum di hash
    //nyocokin password sama ke yang baru ditarik diatas (findemail) jadi ngedefinenya ke findemail
    //compare inputan user dengan yang ada dalam database
            var matchPassword = await bcrypt.compare(data_password, findemail.password)
            if(!matchPassword){
            throw new Error (' unable to login')
            }
        return findemail

        } catch (error) {
            console.log(error)
        }

}

//membuat fuction yang akan dijalankan sebelum proses user.svae()

userSchema.pre('save', async function(next){
    const user = this // this itu object user. nyimpan diri sendiri

    if(user.isModified('password')){
        user.password =  await bcrypt.hash(user.password, 8)
        
    } //akan bernilai true saat pertama dibuat dan mengalami perubahan

    next()

    

   
})



const User = mongoose.model('User', userSchema)

module.exports = User