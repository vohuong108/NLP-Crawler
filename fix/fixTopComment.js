const TopComment = require("../models/TopComment");
const mongoose = require("mongoose");

const updateSequantialTopComment = async (curId, nextOrder) => {
    for(let i=0; i<3; i++) {
        try {
            console.log("INPUT: ", nextOrder, " ID: ", curId);

            if(nextOrder !== null && curId !== null) {
                let result = await TopComment.findOneAndUpdate(
                    {_id: {$gt: curId}}, 
                    {$set: {index: nextOrder}}, 
                    {sort: {_id: 1}, returnDocument: "after"}
                );
                console.log("CREATE ORDER DONE: ", result?._id, " WITH INDEX: ", result?.index);

                if(result?._id) return {
                    message: "CREATE ORDER DONE", 
                    currentOrder: result.index,
                    currentId: result._id
                };
                else return { message: "FULL CREATE ORDER" };

            } else {
                let result = await TopComment.findOneAndUpdate(
                    {}, 
                    {$set: {index: 0}}, 
                    {sort: {_id: 1}, returnDocument: "after"}
                );
                console.log("CREATE ORDER DONE: ", result?._id, " WITH INDEX: ", result?.index);

                if(result?._id) return {
                    message: "CREATE ORDER DONE", 
                    currentOrder: result.index,
                    currentId: result._id
                };
                else return { message: "FAILD INIT CREATE ORDER" };
            }

        } catch (err) {
            console.error("^^^^^^^^^^^[DATABASE]^^^^^^^^^^^ ERROR IN CREATE ORDER: ", err);
            console.log("===>> Replay ", i, "times");
            
            if(i === 2) return {message: "FAILED CREATE ORDER"};
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}

const handleUpdateIndexTopComment = async () => {
    let order = null;
    let currentId = null;

    while(true) {
        let res = await updateSequantialTopComment(currentId, order);
        console.log("RES: ", res);
        if(
            (res.message === "FULL CREATE ORDER") || 
            (res.message === "FAILED CREATE ORDER") ||
            (res.message === "FAILD INIT CREATE ORDER")) break;
        
        else {
            order = res.currentOrder + 1;
            currentId = res.currentId
            await new Promise((resolve, _) => setTimeout(resolve, 500));
        }
    }
}

module.exports = { handleUpdateIndexTopComment }