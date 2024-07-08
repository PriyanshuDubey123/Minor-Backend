const mongoose = require('mongoose');

const individualCreatorAnalyticsScahema = new mongoose.Schema({
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator',required:true},
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    transactions: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        order_id: {
            type: String
        },
        txnType: {
            type: String,
            default: 'Course Payment',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
    }],
    dateWiseAnalytics: [{
        date: { type: String },
        totalSales: { type: Number },
        totalRevenue: { type: Number },
    }]
}, {
    timestamps: true
});

const individualCreatorAnalytics = mongoose.model('individualCreatorAnalytics', individualCreatorAnalyticsScahema);

module.exports = individualCreatorAnalytics;
