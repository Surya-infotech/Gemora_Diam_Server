const mongoose = require("mongoose");

const socialmediaSchema = new mongoose.Schema({
    socialmedia: [
        {
            platform: { type: String },
            url: { type: String }
        }
    ]
});

const SocialMediaModel = mongoose.model("SocialMedia", socialmediaSchema);

module.exports = SocialMediaModel;
