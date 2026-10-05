const mongoose = require("mongoose");

const socialmediaSchema = new mongoose.Schema({
    socialmedia: [
        {
            platform: { type: String },
            url: { type: String }
        }
    ]
});

const SocialMediaModel = mongoose.models.SocialMedia || mongoose.model("SocialMedia", socialmediaSchema);
const SocialMedia = (db) => SocialMediaModel;
module.exports = Object.assign(SocialMedia, SocialMediaModel);
