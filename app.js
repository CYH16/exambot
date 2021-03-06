//var appInsights = require('applicationinsights');
//appInsights.setup('9efcda74-3dde-4b51-9ec9-d0db387f9eed').start();
let restify = require('restify');
let builder = require('botbuilder');

///////////////////////////////////////////////////////////////////////////////////////////////
var azure = require('botbuilder-azure'); 
var tableName = "cyhexambot"; // You define
var storageName = "cyhexambot"; // Obtain from Azure Portal
var storageKey = "fFVzZQ3ynuSvA1nKD7Pd9JDFPsT0dYXb9FHEdh7+JVYM00mh+lIzBs4uCE+VDJqKKs+jIVPZl3HGBI2ofu73eQ=="; // Obtain from Azure Portal
var azureTableClient = new azure.AzureTableClient(tableName, storageName, storageKey);
var tableStorage = new azure.AzureBotStorage({gzipData: false}, azureTableClient);
///////////////////////////////////////////////////////////////////////////////////////////////

//================================================
//Bot Setup
//================================================

//Setup Restify Server
let server = restify.createServer();
server.listen(process.env.port||process.env.PORT||3978, function(){
    console.log('%s listening to %s',server.name,server.url);})

let connector = new builder.ChatConnector({
    appId: "cd285edd-5502-49bb-9e0c-fc8b823a641a",
    appPassword: "ZnoNu9TsTX6tLAaNX6mo3rx"
    });
let bot = new builder.UniversalBot(connector).set('storage', tableStorage);

server.post('/api/messages',connector.listen());
const testData = JSON.parse(require('fs').readFileSync('./test.json', 'utf8'));


bot.beginDialogAction('getstarted', '/');

//Get User ID
bot.dialog('/',[
    (session) =>
    {
        session.send(`哈囉~${session.message.user.name}你好\~\~`);
		session.send("我是一個練習醫師一階國考的聊天機器人，可以讓你練習歷屆的國考題。"); 
		session.send("對了偷偷跟你說個秘密，我之後要搬家囉！");
		session.send('以後我會變成"考古豹 CougarBot・考古題共享平台"，功能更多更齊全，等你一起來發掘！');
		session.send("快去看看吧！\n\n粉專：https://www.facebook.com/cougarbot/\n\n網站：https://cougarbot.cc/");
        session.beginDialog('/setting');
    }
])


//Pick Sections
bot.dialog('/setting',[(session,args,next)=>{
        if(!session.privateConversationData.sec || session.privateConversationData.sec==null)
        {
            builder.Prompts.choice(session,"那麼你想要練習哪一科咧？\n",Object.keys(testData).join('|').concat("|病理|胚胎|我有話想說"),{listStyle: builder.ListStyle["button"],retryPrompt:"請選擇我們現在有提供的科目喔><\n\n目前有：微免、生化、生理、藥理、解剖、病理、胚胎"});
		}else{next();}
    },(session,results,next)=>{
		if(results.response == undefined){next();}
		else if(results.response.entity==="病理"){session.beginDialog('/album')}
		else if(results.response.entity==="胚胎"){session.beginDialog('/album')}
		else if(results.response.entity==="我有話想說"){session.beginDialog('/feedback')}
        else{
			session.privateConversationData.sec = [results.response.entity];
			if(testData[results.response.entity].constructor===Object){
				builder.Prompts.choice(session,"那麼要練習哪個部分呢？",Object.keys(testData[results.response.entity]).join('|').concat("|算了重選科目吧"),{listStyle: builder.ListStyle["button"],retryPrompt:"請選擇我們現在有提供的科目喔><\n\n微免：免疫、微生物\n\n解剖：四肢、神解、胸背腹、頭頸、骨盆會陰"})  
			}else{
				next({response:null});
			}
		}
		
    }
    ,(session,results) => {
        
        //console.log(results);
		if(results.response==null){
			if(session.privateConversationData.sec.length==1){session.send("你要做的是%s",session.privateConversationData.sec[0])}
			else{session.send(`你要做的是${session.privateConversationData.sec[0]}之中的${session.privateConversationData.sec[1]}`);}
		}
		else if(results.response.entity==="算了重選科目吧" && results.response.entity!=null){session.privateConversationData.sec = null ;session.replaceDialog('/setting');}
        else{
			session.privateConversationData.sec.push(results.response.entity);
			session.send(`你選擇了${session.privateConversationData.sec[0]}之中的${session.privateConversationData.sec[1]}`);
		}
		session.replaceDialog('/number');
		        
    }])
bot.dialog('/number',[
    (session)=>{
		builder.Prompts.number(session, "那你一次要答幾題呢？（請自己輸入數字喔）",{retryPrompt:'請輸入數字喔~'});
	},(session, results)=>{
		session.privateConversationData.num = results.response;
        if(session.privateConversationData.num>10){
			session.send("請先輸入1~10的數字喔，不然我怕有人輸入10000然後寫到天荒地老XD");
			session.replaceDialog('/number');
		}
		else if(session.privateConversationData.num<1){
			session.send("恩...應該至少要做一題吧XD");
			session.replaceDialog('/number');
		}
		else{
			session.privateConversationData.count = 0;       
			session.privateConversationData.num = results.response;
			session.beginDialog('/qa');
		}
    }])
bot.dialog('/qa',[
    (session,next)=>{
		session.send("開始囉");
        session.beginDialog('/ask');
    },(session)=>{
		session.send("對了偷偷跟你說個秘密，我之後要搬家囉！");
		session.send('以後我會變成"考古豹 CougarBot・考古題共享平台"，功能更多更齊全，等你一起來發掘！');
		session.send("快去看看吧！\n\n粉專：https://www.facebook.com/cougarbot/\n\n網站：https://cougarbot.cc/");
        builder.Prompts.choice(session,"要繼續做題嗎？","換別科好了|再來吧",{listStyle: builder.ListStyle["button"],retryPrompt:'歹勢我看不懂>< 我只是想知道你要繼續練習這科嗎？\n\n請輸入"換別科好了"或是"再來吧"'});
    },(session,results)=>
    {
        if(results.response.entity==="換別科好了")
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
        builder.Prompts.choice(session,q.join('\n\n').replace(/"/g,""),"A|B|C|D",{listStyle: builder.ListStyle["button"],retryPrompt:'請選擇ABCD喔'});
        
    },(session,results)=>{
        if(session.dialogData.a.replace(/"/g,'')!=results.response.entity){
			if(session.dialogData.a.replace(/"/g,'').includes(results.response.entity)){
				session.send("答對囉，不過這題送分，正確的答案有%s。",session.dialogData.a.replace(/"/g,''));
			}
            else{session.send("答錯囉，正確的答案是%s。",session.dialogData.a.replace(/"/g,''));}
        }else{
            session.send("答對了！");
        }
        if(session.privateConversationData.count<session.privateConversationData.num){
            session.replaceDialog('/ask')
        }else{
            session.endDialog();
        }
    }])

bot.dialog('/feedback',[
    (session,next)=>{
		session.send("對了偷偷跟你說個秘密，我之後要搬家囉！");
		session.send('以後我會變成"考古豹 CougarBot・考古題共享平台"，功能更多更齊全，等你一起來發掘！');
		session.send("快去看看吧！\n\n粉專：https://www.facebook.com/cougarbot/\n\n網站：https://cougarbot.cc/");
        builder.Prompts.choice(session,"下面的連結是一個回饋表單，如果有什麼想說的話（像是哪裡怪怪的啦、哪邊可以改得更好啦），歡迎跟我們說！\n\nhttp://ppt.cc/CxyeV","回去選科目吧",{listStyle: builder.ListStyle["button"],retryPrompt:'輸入"回去選科目吧"重新做題目吧~'});
    },(session)=>{
        session.replaceDialog('/setting');
    }])

bot.dialog('/album',[
    (session,next)=>{
        builder.Prompts.choice(session,"現在還沒有病理和胚胎的題庫喔><不過下面的連結是由我的同學做的每日一病以及每日一胎，歡迎看看！\n\nhttps://www.facebook.com/pg/ExamBot/photos/?tab=albums","回去選其他科吧",{listStyle: builder.ListStyle["button"],retryPrompt:'輸入"回去選其他科吧"去做其他題目吧~'});
    },(session)=>{
        session.replaceDialog('/setting');
    }])

