const fs = require('fs');
const { Parser, AsyncParser, parseAsync } = require('json2csv');
const mongoose = require('mongoose');
const ListComment = require('./models/ListComment');
const ListId = require('./models/ListId');
let newLine = '\r\n';

const fields = ['Total', 'Name'];
const opts = { fields: fields, header: false };

const getCommentFromDB = async () => {
    //TODO: re-run 3 times when fail occur
    for(let i = 0; i < 3; i += 1) {
        try {
            let currentDate = new Date();
            let day = currentDate.getDate();
            let month = currentDate.getMonth();
            let year = currentDate.getFullYear();

            let filter = { "created_at": Date, $and: [{nextPage: null}, {amountFetched: {$gt: 0}}] }
            let projection = ['videoId', 'nextPage'];
            let items = await ListComment.find(filter, projection);
            
            console.log("GET LIST NEW CRAWL SUCCESS: ", items?.length);
            console.log("LIST NEW CRAWL: ", items?.map(i => i.videoId));
            return items;
        } catch (err) {
            console.error("ERROR IN GET LIST VIDEO READY BY BATCH ID", err); 
            console.log("=>>>>> Replay ", i, "times");
            if(i === 2) return {state: "ERROR GET BY BATCH ID" };
            
        }
        await new Promise((resolve, _) => setTimeout(resolve, 1000));
    }
}


const exportToCsv = async (data, fields) => {

    let appendOpts = { fields: fields, header: false };
    let createOpts = { fields };
    const transformOpts = { highWaterMark: 8192 };

    try {
        let result = await parseAsync(data, appendOpts);
        console.log("result: ", typeof(result));

        fs.appendFile('./output/test.csv', (result + newLine), function (err) {
            if (err) throw err;
            console.log('The "data to append" was appended to file!');
        });
    } catch (err) {
        console.log("ERROR: ", err);
    }
}

// exportToCsv(appendThis, fields);

let currentDate = new Date("2021-09-18T12:28:04.989+00:00").toISOString();
// let day = currentDate.getDate();
// let month = currentDate.getMonth();
// let year = currentDate.getFullYear();

console.log("now: ",  currentDate);

