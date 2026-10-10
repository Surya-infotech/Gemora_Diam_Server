const express = require("express");
const supportrouter = express.Router();
const contactuscontroller = require("../../controllers/AdminPanel/Support/contactus-controller");
const subscribercontroller = require("../../controllers/AdminPanel/Support/subscriber-controller");
const faqcontroller = require("../../controllers/AdminPanel/Support/faq-controller");
const policycontroller = require("../../controllers/AdminPanel/Support/policy-controller");
const bannercontroller = require("../../controllers/AdminPanel/Support/banner-controller");
const collectionbannercontroller = require("../../controllers/AdminPanel/Support/collectionbanner-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");
const { uploadToS3 } = require("../../utils/s3Config-admin");

// Contact Us Routes
supportrouter.route("/GetContactUs").get(authMiddleware, contactuscontroller.get_contactus);
supportrouter.route("/AddContactUs").post(contactuscontroller.add_contactus);

// Newsletter Subscriber Routes
supportrouter.route("/SubscribeNewsletter").post(subscribercontroller.subscribe_newsletter);
supportrouter.route("/GetSubscribers").get(authMiddleware, subscribercontroller.get_subscribers);

// FAQ Routes
supportrouter.route("/GetFAQs").get(authMiddleware, faqcontroller.get_faqs);
supportrouter.route("/GetActiveFAQs").get(faqcontroller.get_active_faqs);
supportrouter.route("/AddFAQ").post(authMiddleware, faqcontroller.add_faq);
supportrouter.route("/EditFAQ/:faqid").get(authMiddleware, faqcontroller.edit_faq);
supportrouter.route("/UpdateFAQStatus/:faqid").put(authMiddleware, faqcontroller.update_faq_status);
supportrouter.route("/UpdateFAQ/:faqid").put(authMiddleware, faqcontroller.update_faq);
supportrouter.route("/DeleteFAQ/:faqid").delete(authMiddleware, faqcontroller.delete_faq);

// Policy Routes
supportrouter.route("/GetPolicies").get(authMiddleware, policycontroller.get_policies);
supportrouter.route("/GetActivePolicies").get(policycontroller.get_active_policies);
supportrouter.route("/AddPolicy").post(authMiddleware, policycontroller.add_policy);
supportrouter.route("/EditPolicy/:policyid").get(authMiddleware, policycontroller.edit_policy);
supportrouter.route("/UpdatePolicyStatus/:policyid").put(authMiddleware, policycontroller.update_policy_status);
supportrouter.route("/UpdatePolicy/:policyid").put(authMiddleware, policycontroller.update_policy);
supportrouter.route("/DeletePolicy/:policyid").delete(authMiddleware, policycontroller.delete_policy);

// Banner Routes
supportrouter.route("/GetBanners").get(authMiddleware, bannercontroller.get_banners);
supportrouter.route("/GetActiveBanners").get(bannercontroller.get_active_banners);
supportrouter.route("/AddBanner").post(authMiddleware, uploadToS3("banners"), bannercontroller.add_banner);
supportrouter.route("/EditBanner/:bannerid").get(authMiddleware, bannercontroller.edit_banner);
supportrouter.route("/UpdateBannerStatus/:bannerid").put(authMiddleware, bannercontroller.update_banner_status);
supportrouter.route("/UpdateBanner/:bannerid").put(authMiddleware, uploadToS3("banners"), bannercontroller.update_banner);
supportrouter.route("/DeleteBanner/:bannerid").delete(authMiddleware, bannercontroller.delete_banner);

// Collection Banner Routes (Split Promotional Banners)
supportrouter.route("/GetCollectionBanners").get(authMiddleware, collectionbannercontroller.get_collection_banners);
supportrouter.route("/GetActiveCollectionBanners").get(collectionbannercontroller.get_active_collection_banners);
supportrouter.route("/AddCollectionBanner").post(authMiddleware, uploadToS3("collectionbanners"), collectionbannercontroller.add_collection_banner);
supportrouter.route("/EditCollectionBanner/:bannerid").get(authMiddleware, collectionbannercontroller.edit_collection_banner);
supportrouter.route("/UpdateCollectionBannerStatus/:bannerid").put(authMiddleware, collectionbannercontroller.update_collection_banner_status);
supportrouter.route("/UpdateCollectionBanner/:bannerid").put(authMiddleware, uploadToS3("collectionbanners"), collectionbannercontroller.update_collection_banner);
supportrouter.route("/DeleteCollectionBanner/:bannerid").delete(authMiddleware, collectionbannercontroller.delete_collection_banner);

module.exports = supportrouter;
