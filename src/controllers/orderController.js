const OrderModel = require('../models/orderModel.js');
const UserModel = require('../models/userModel.js');
const CartModel = require('../models/cartModel.js');
const jwt = require('jsonwebtoken');

const { isValidObjectId, isValid, isValidRequest, nameRegex, addressValid, mailRegex, mobileRegex, passwordRegex, pinValid, imageValid, isValidSizes, alphaNumericValid } = require('../validators/validations.js');
const { findOne, findOneAndUpdate } = require('../models/orderModel.js');

const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        const data = req.body;
        const { cartId } = data;
        
        if (!isValid(cartId))
            return res.status(400).send({ status: false, message: "CartId is required" });

        if (!isValidObjectId(cartId))
            return res.status(400).send({ status: false, message: `The given cartId: ${cartId} is not in proper format` });

        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

        if (req.decodedToken != userId)
            return res.status(403).send({ status: false, message: "Error, authorization failed" });

        const findCart = await CartModel.findOne({ _id: cartId, userId: userId });
        if (!findCart)
            return res.status(404).send({ status: false, message: "Cart not found" });


        // if (findCart.userId.toString() !== userId)
        //     return res.status(400).send({ status: false, message: `The cart is not created with the given userId ${findCart.userId}` })

        if (findCart) {
            let array = findCart.items
            var count = 0;
            for (let i = 0; i < array.length; i++) {
                if (array[i].quantity) {
                    count += findCart.items[i].quantity;
                }
            }
        }

        if (findCart.items.length == 0)
            return res.status(400).send({ status: false, message: "You have not added any products in your cart" });

        let response = {
            userId: findCart.userId,
            items: findCart.items,
            totalQuantity: count
        };

        const orderCreated = await OrderModel.create(response)

        const updatedCart = await CartModel.findOneAndUpdate({ _id: cartId, userId: userId }, { $set: { items: [], totalPrice: 0, totalItems: 0 } }, { new: true })

        let finalResponse = {
            _id: orderCreated._id,
            userId: orderCreated.userId,
            items: orderCreated.items,
            totalQuantity: orderCreated.totalQuantity,
            cancellable: orderCreated.cancellable,
            status: orderCreated.status

        }
        return res.status(201).send({ status: true, message: 'Success', data: finalResponse })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const updateOrder = async function (req, res) {
    try {
        const userId = req.params.userId;
        const data = req.body;
        const { orderId, status } = data;

        if (!isValidRequest(data))
            return res.status(400).send({ status: false, message: "Please provide data in the request body" })

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `The given userId: ${userId} is not in proper format` });

        if (!isValid(orderId))
            return res.status(400).send({ status: false, message: "OrderId is Required" });

        if (!isValidObjectId(orderId))
            return res.status(400).send({ status: false, message: "The given orderId is not in proper format" });

        const findUser = await UserModel.findOne({ _id: userId });
        if (!findUser)
            return res.status(404).send({ status: false, message: `User details not found with this provided userId: ${userId}` });

        // if (req.decodedToken != userId)
        //     return res.status(403).send({ status: false, message: "Error, authorization failed" });

        const findOrder = await OrderModel.findOne({ _id: orderId, userId: userId })
        if (!findOrder)
            return res.status(404).send({ status: false, message: `Order details is not found with the given OrderId: ${userId}` })

        // if (findOrder.cancellable == false) {
        //     return res.status(400).send({ status: false, message: " Order is already cancelled" })
        // }

        if (!isValid(status))
            return res.status(400).send({ status: false, message: "Status is required and the fields will be 'pending', 'completed', 'cancelled' only  " });

        if (status == "pending") {
            if (findOrder.status == "pending")
                return res.status(400).send({ status: false, message: "It is already pending" })

            if (findOrder.status == "completed")
                return res.status(400).send({ status: false, message: "It is already completed" })

            if (findOrder.status == "cancelled")
                return res.status(400).send({ status: false, message: "It is already cancelled" })
        }
        if (status == "completed") {
            if (findOrder.status == "pending") {
                const UpdateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status, isDeleted: true, deletedAt: Date.now() } }, { new: true })
                return res.status(200).send({ status: true, message: 'Success', data: UpdateStatus })
            }

            if (findOrder.status == "completed")
                return res.status(400).send({ status: false, message: "It is already completed" })

            if (findOrder.status == "cancelled")
                return res.status(400).send({ status: false, message: "It is already cancelled" })
        }
        if (status == "cancelled") {
            if (findOrder.status == "pending")
                findOrder.status == data.status.cancelled;

            if (findOrder.status == "completed")
                return res.status(400).send({ status: false, message: "It is already completed" })

            if (findOrder.status == "cancelled")
                return res.status(400).send({ status: false, message: "It is already cancelled111" })
        }

        // if (status) {
        //     if (!isValid(status))
        //     return res.status(400).send({ status: false, message: "status required" })

        //     let statusIndex = ["pending", "completed", "cancelled"]
        //     if (statusIndex.indexOf(status) == -1)
        //         return res.status(400).send({ status: false, message: "only statusIndex" });

        //     if (findOrder.status == 'pending') {
        //         const UpdateStatus = await OrderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status, isDeleted: true, deletedAt: Date.now() } }, { new: true })
        //         return res.status(200).send({ status: true, message:'Success', data: UpdateStatus })
        //     }
        //     if (findOrder.status == 'completed') {
        //         return res.status(400).send({ status: false, message: "The status is completed" })

        //     }
        //     if (findOrder.status == 'cancelled') {
        //         return res.status(400).send({ status: false, message: "The status is cancled" })
        //     }

        // } else {
        //     return res.status(400).send({status: false, message: " please provide status"})
        // }


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createOrder, updateOrder }