import re
import json
import os
tag = re.compile('\{.*?\}')
dtag = re.compile('\d+')
pwd = os.path.abspath(__file__)
dataPath = os.path.join(os.path.split(os.path.split(pwd)[0])[0],"data")
jsonPath = os.path.join(os.path.split(os.path.split(pwd)[0])[0],"test.json")
fnames = os.listdir(dataPath)
qas={}
defaultKey = ''
for fname in fnames:
    cats = fname.split(".")[0].split("_") ;
    def getqaList(idxs,qaDict):
        if len(idxs)>1:
            if(idxs[0] not in qaDict):
                qaDict[idxs[0]]={}
            nextDict = qaDict[idxs[0]]
            idxs.pop(0)
            return getqaList(idxs,nextDict)
        else:
            if(idxs[0] not in qaDict):
                qaDict[idxs[0]]=[]
            return qaDict[idxs[0]]
    qaList = getqaList(cats,qas)
    with open(os.path.join(dataPath,fname), encoding="utf-8") as f:
        for line in f:
            qa = tag.findall(line)
            if len(qa) != 0:
                qaDict={};
                qaStr = qa[0].replace('{','').replace('}','').replace('\\n','\n');
                qaSplit = qaStr.split(',');
                if len(qaSplit)>2:
                    qaSplit = [qaSplit[0]]+[''.join(qaSplit[1:])]
                for elem in qaSplit:
                    key = elem.split(':')[0]
                    context = elem.split(':')[1]
                    qaDict[key] = context
                qaList.append((qaDict))

with open(jsonPath,'w') as wf:
    json.dump(qas,wf)

