const mongoose = require('mongoose');

// const uri = "mongodb+srv://nlpUser:nlpuser12345@cluster0.zccf9.mongodb.net/nlpDatabase?retryWrites=true&w=majority";
// const uri = "mongodb+srv://HuongNguyen:abc**123@cluster0.lo0s4.mongodb.net/PROJETNLP?retryWrites=true&w=majority";
// const uri = "mongodb+srv://nlpSubDB:nlp12345@cluster0.5guij.mongodb.net/nlpSubDB?retryWrites=true&w=majority";
// const uri = "mongodb+srv://nlpUser:nlp12345@cluster0.lslkw.mongodb.net/nlpSubYtb?retryWrites=true&w=majority";
const uri = "mongodb://localhost:27017/nlpLocal"


const connectDB = async () => {
    for(let i = 0; i < 3; i += 1) {
        try {
            await mongoose.connect(uri, { 
                useUnifiedTopology: true, 
                useNewUrlParser: true 
            });
            console.log("db connectted...!");
            return "CONNECTED TO DATABASE";
            
        } catch (err) {
            console.log("Occured error while connect to DB");
            console.error("Error: ", err);

            if(i === 2) return "FAILED IN CONNECT TO DATABASE";
        }
        await new Promise((resolve, _) => setTimeout(resolve, 800));
    }
}


module.exports = connectDB;

