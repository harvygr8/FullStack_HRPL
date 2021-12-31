const fs = require('fs')

let fName = new Date();
let day = fName.getDay();
let month = fName.getMonth();
let year = fName.getFullYear();

const fileStamp = `${day}_${month}_${year}`;

const Markers ={
  INFO:'[INFO]:',
  WARN:'[WARN]:',
}
Object.freeze(Markers);

//Reserved for Library
const Header={
  MSG:'[MESSAGE]:',
  ERR:'[ERROR]:'
}
Object.freeze(Header);


function logToText(params){

  let currMark='';
  let content;
  let timeStamp = new Date();
  let hours = timeStamp.getHours();
  let minutes = timeStamp.getMinutes();
  let seconds = timeStamp.getSeconds();

  switch(params.mark){
    case 'info':
      currMark = Markers.INFO;
      break;
    case 'warn':
      currMark = Markers.WARN;
      break;
    default:
      if(!params.quiet) console.log(`${Header.ERR}No Valid Marker Specified,Logger Quitting`);
      return;
  }


  content = `[${hours}:${minutes}:${seconds}]:${currMark} ${params.content}\n`;

  let stream = fs.createWriteStream(params.path, {flags:'a'});
  stream.write(content);
  stream.end();


  if(!params.quiet) console.log(`${Header.MSG}Logged to File`);
}

export {logToText,fileStamp};

//logToText({path:'test.txt',content:"HELLO",mark:'info'},false);
