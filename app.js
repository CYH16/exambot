let restify = require('restify');
let builder = require('botbuilder');


//================================================
//Bot Setup
//================================================

//Setup Restify Server
let server = restify.createServer();
server.listen(process.env.port||process.env.PORT||3978, function(){
    console.log('%s listening to %s',server.name,server.url);})

let connector = new builder.ChatConnector({
    appId: "b16c5dc2-017c-4011-9c48-b16d47482b56",
    appPassword: "zCVoNcjxFARetHdDyA0DckB"
    });
let bot = new builder.UniversalBot(connector);

server.post('/api/messages',connector.listen());
const testData = JSON.parse(require('fs').readFileSync('./test.json', 'utf8'));


bot.beginDialogAction('getstarted', '/');

//Get User ID
bot.dialog('/',[
    (session) =>
    {
        session.send(`Hi ${session.message.user.name}!`);    
        session.beginDialog('/setting');
    }
])


//Pick Sections
bot.dialog('/setting',[(session)=>{
        if(!session.privateConversationData.sec || session.privateConversationData.sec==null)
        {
            builder.Prompts.choice(session,"哈囉，這是一個練習國考的聊天機器人。\n你要練習哪一科咧？\n",Object.keys(testData).join('|'),{listStyle: builder.ListStyle["button"],retryPrompt:'請選擇選項'});
        }
    },(session,results,next)=>{
         session.privateConversationData.sec = [results.response.entity];
         if(testData[results.response.entity].constructor===Object){
            builder.Prompts.choice(session,"要從哪個部分開始呢？",Object.keys(testData[results.response.entity]).join('|'),{listStyle: builder.ListStyle["button"],retryPrompt:"請選擇選項"})  
         }else{
            next({response:null});
         }
    }
    ,(session,results) => {
        
        console.log(results);
        if(results.response==null){
            session.send("你選擇的是 %s",session.privateConversationData.sec[0])
        }else{
            session.privateConversationData.sec.push(results.response.entity);
            session.send(`你選擇的是 ${session.privateConversationData.sec[0]} ${results.response.entity}`);
        }
        builder.Prompts.number(session, "你一次要答幾題呢？",{retryPrompt:'請選擇選項'});
    },function(session,results){
        session.privateConversationData.count = 0;       
        session.privateConversationData.num = results.response;
        session.beginDialog('/qa')
    }])

bot.dialog('/qa',[
    (session,next)=>{
        session.beginDialog('/ask');
    },(session)=>{
        builder.Prompts.choice(session,"要繼續做題嗎？","換別科好了|繼續",{listStyle: builder.ListStyle["button"],retryPrompt:'請選擇選項'});
    },(session,results)=>
    {
        if(results.response.entity!="要繼續做題嗎？")
        {  
            session.privateConversationData.sec = null;
        }   
        session.replaceDialog('/setting');
    }])

bot.dialog('/ask',[(session)=>{
        const qs = session.privateConversationData.sec.length==2? testData[session.privateConversationData.sec[0]][session.privateConversationData.sec[1]] : testData[session.privateConversationData.sec[0]];
        const baseLength = qs.length;
        session.dialogData.randIdx = Math.floor(Math.random()*baseLength);
        session.privateConversationData.count++;
        const q = (qs[session.dialogData.randIdx])['題目'].split('\n');
        session.dialogData.a = (qs[session.dialogData.randIdx])['答案'];
        builder.Prompts.choice(session,q.join('\n\n').replace(/"/g,""),"A|B|C|D",{listStyle: builder.ListStyle["button"],retryPrompt:'請選擇選項'});
        
    },(session,results)=>{
        if(session.dialogData.a.replace(/"/g,'')!=results.response.entity){
            session.send("正確的解答是 %s",session.dialogData.a.replace(/"/g,''));
        }else{
            session.send("答對了");
        }
        if(session.privateConversationData.count<session.privateConversationData.num){
            session.replaceDialog('/ask')
        }else{
            session.endDialog();
        }
    }])



