const express = require("express");
const supportrouter = express.Router();
const contactuscontroller = require("../../controllers/AdminPanel/Support/contactus-controller");
const subscribercontroller = require("../../controllers/AdminPanel/Support/subscriber-controller");
const faqcontroller = require("../../controllers/AdminPanel/Support/faq-controller");
const policycontroller = require("../../controllers/AdminPanel/Support/policy-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

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

module.exports = supportrouter;
