const DetailVideo = require("../models/DetailVideo");

const createSequantialVideoDetail = async (nextOrder) => {
    for(let i=0; i<3; i++) {
        try {
            console.log("INPUT: ", nextOrder);
            if(nextOrder !== null && nextOrder !== undefined) {
                let result = await DetailVideo.findOneAndUpdate({index: {$exists: false}}, {$set: {index: nextOrder}}, {sort: {_id: 1}, returnDocument: "after"});
                console.log("CREATE ORDER DONE: ", result?._id, " WITH INDEX: ", result?.index);

                if(result?._id) return {message: "CREATE ORDER DONE", currentOrder: result.index};
                else return {message: "FULL CREATE ORDER"};
            } else {
                let result = await DetailVideo.findOne({index: {$not: {$eq: null}}}, ["_id", "index"], {sort: {_id: -1}});
                console.log("FIND DOCUMENT DONE: ", result?._id, " WITH INDEX: ", result?.index);

                if(result?._id) return {message: "FIND DOCUMENT HAS INDEX FIELD DONE", currentOrder: result.index};
                else return {message: "ALL DOCUMENT HASN'T INDEX FIELD", currentOrder: -1};
            }
        } catch (err) {
            console.error("^^^^^^^^^^^[DATABASE]^^^^^^^^^^^ ERROR IN CREATE ORDER: ", err);
            console.log("===>> Replay ", i, "times");
            
            if(i === 2) return {message: "FAILED CREATE ORDER"};
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

module.exports = { createSequantialVideoDetail }