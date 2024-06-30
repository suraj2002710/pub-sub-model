const {kafka}=require("kafkajs")

let kafkas=new kafka({
    broker:[""],
    
})

let prodcer=null

const createProducer=async()=>{
    if(prodcer){
        return prodcer
    }
    const _prodcer=kafkas.prodcer()
    _prodcer.connect()
    prodcer=_prodcer
    return prodcer   
}

exports.produceMessage=(message)=>{
    try {
        const produce=createProducer()
        prodcer.send({
            message:[{key:"msg",message}],topic:"MESSAGE"
        })
        return true
    } catch (error) {
        console.log(error)
    }
}

