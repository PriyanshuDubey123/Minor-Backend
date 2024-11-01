const { Cart } = require("../model/Cart");
const { redis } = require("../utils/features");

exports.fetchCartByUser = async (req,res)=>{

    const {user} = req.query;

    try{

       let cart;
        
       cart = await redis.get("Cart "+user);
       if(cart){
        cart = JSON.parse(cart);
       }
       else{
          cart = await Cart.find({user:user}).populate('course');
          redis.set("Cart "+user, JSON.stringify(cart));
          redis.expire("Cart "+user, 30);
       }
         res.status(200).json(cart);
    }
    catch(err){
        res.status(400).json(err);
    }
}

exports.addtoCart = async(req,res)=>{
    
    const cart = new Cart(req.body);
    try{
        const doc = await cart.save();
        const result = await doc.populate('course');
        res.status(201).json(result);
    }
     catch(err){
        console.log(err);
     res.status(400).json(err);
     }
}

exports.deleteFromCart = async(req,res)=>{
    
    const {id} = req.params;
    try{
        const doc = await Cart.findByIdAndDelete(id);
        res.status(200).json(doc);
    }
    catch(err){
        res.status(400).json(err);
    }
}

exports.updateCart = async(req,res)=>{
    const {id} = req.params;

    try{    
        const cart = await Cart.findByIdAndUpdate(id,req.body,{new:true,});
        const result = await cart.populate('course');
        res.status(200).json(result);
    }
     catch(err){
     res.status(400).json(err);
     }
}