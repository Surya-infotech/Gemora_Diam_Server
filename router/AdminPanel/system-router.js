const express = require("express");
const systemrouter = express.Router();
const currencycontroller = require("../../controllers/AdminPanel/System/currency-controller");
const taxcontroller = require("../../controllers/AdminPanel/System/tax-controller");
const fiscalyearcontroller = require("../../controllers/AdminPanel/System/Setting/fiscalyear-controller");
const generalsettingcontroller = require("../../controllers/AdminPanel/System/Setting/generalsetting-controller");
const socialmediacontroller = require("../../controllers/AdminPanel/System/Setting/socialmedia-controller");
const miscsettingcontroller = require("../../controllers/AdminPanel/System/Setting/miscsetting-controller");
const invoicesettingcontroller = require("../../controllers/AdminPanel/System/Setting/invoicesetting-controller");
const contactuscontroller = require("../../controllers/AdminPanel/System/contactus-controller");
const subscribercontroller = require("../../controllers/AdminPanel/System/subscriber-controller");
const helpcentercontroller = require("../../controllers/AdminPanel/System/helpcenter-controller");
const authmiddleware = require("../../middlewares/auth-middleware");

// Contact Us Routes
systemrouter.route("/GetContactUs").get(authmiddleware.authmiddleware, contactuscontroller.get_contactus);
systemrouter.route("/AddContactUs").post(contactuscontroller.add_contactus);

// Newsletter Subscriber Routes
systemrouter.route("/SubscribeNewsletter").post(subscribercontroller.subscribe_newsletter);
systemrouter.route("/GetSubscribers").get(authmiddleware.authmiddleware, subscribercontroller.get_subscribers);

// Help Center Routes
systemrouter.route("/GetHelpCenter").get(authmiddleware.authmiddleware, helpcentercontroller.get_helpcenter);
systemrouter.route("/GetHelpCenterByOwner/:ownerId").get(authmiddleware.authmiddleware, helpcentercontroller.get_owner_helpcenter);
systemrouter.route("/GetHelpCenterDetail/:helpCenterId").get(authmiddleware.authmiddleware, helpcentercontroller.get_helpcenter_by_id);
systemrouter.route("/ResolveHelpCenter/:helpCenterId").put(authmiddleware.authmiddleware, helpcentercontroller.resolve_helpcenter);
systemrouter.route("/AddHelpCenterByOwner/:ownerId").post(authmiddleware.authmiddleware, helpcentercontroller.add_owner_helpcenter);
systemrouter.route("/AddHelpCenterMessage/:helpCenterId").post(authmiddleware.authmiddleware, helpcentercontroller.add_helpcenter_message);

// Currency Routes
systemrouter.route("/GetCurrencies").get(authmiddleware.authmiddleware, currencycontroller.get_currency);
systemrouter.route("/GetCurrencies_statustrue").get(authmiddleware.authmiddleware, currencycontroller.get_currency_with_statustrue);
systemrouter.route("/AddCurrency").post(authmiddleware.authmiddleware, currencycontroller.addCurrency);
systemrouter.route("/EditCurrency/:currencyid").get(authmiddleware.authmiddleware, currencycontroller.edit_currency);
systemrouter.route("/UpdateCurrency_status/:currencyid").put(authmiddleware.authmiddleware, currencycontroller.updateCurrency_status);
systemrouter.route("/UpdateCurrency/:currencyid").put(authmiddleware.authmiddleware, currencycontroller.updateCurrency);
systemrouter.route("/DeleteCurrency/:currencyid").delete(authmiddleware.authmiddleware, currencycontroller.deletecurrency);

// Tax Routes
systemrouter.route("/GetTaxes").get(authmiddleware.authmiddleware, taxcontroller.get_taxes);
systemrouter.route("/GetActiveTaxes").get(authmiddleware.authmiddleware, taxcontroller.get_active_taxes);
systemrouter.route("/AddTax").post(authmiddleware.authmiddleware, taxcontroller.add_tax);
systemrouter.route("/EditTax/:taxId").get(authmiddleware.authmiddleware, taxcontroller.edit_tax);
systemrouter.route("/UpdateTaxStatus/:taxId").put(authmiddleware.authmiddleware, taxcontroller.update_tax_status);
systemrouter.route("/UpdateTax/:taxId").put(authmiddleware.authmiddleware, taxcontroller.update_tax);
systemrouter.route("/DeleteTax/:taxId").delete(authmiddleware.authmiddleware, taxcontroller.delete_tax);

// Fiscal Year Routes
systemrouter.route("/CheckCurrentFiscalYear").get(fiscalyearcontroller.check_current_fiscalyear);
systemrouter.route("/GetFiscalYear").get(authmiddleware.authmiddleware, fiscalyearcontroller.get_fiscalyear);
systemrouter.route("/AddFiscalYear").post(authmiddleware.authmiddleware, fiscalyearcontroller.add_fiscalyear);
systemrouter.route("/EditFiscalYear/:fiscalyearId").get(authmiddleware.authmiddleware, fiscalyearcontroller.edit_fiscalyear);
systemrouter.route("/UpdateFiscalYear/:fiscalyearId").put(authmiddleware.authmiddleware, fiscalyearcontroller.update_fiscalyear);
systemrouter.route("/DeleteFiscalYear/:fiscalyearId").delete(authmiddleware.authmiddleware, fiscalyearcontroller.delete_fiscalyear);

// General Setting Routes
systemrouter.route("/GetGeneralSetting").get(authmiddleware.authmiddleware, generalsettingcontroller.get_general_setting);
systemrouter.route("/GetGeneralSetting_landingpage").get(generalsettingcontroller.get_general_setting_for_landingpage);
systemrouter.route("/UpdateGeneralSetting").put(authmiddleware.authmiddleware, generalsettingcontroller.update_general_setting);

// Social Media Routes
systemrouter.route("/GetSocialMedia").get(authmiddleware.authmiddleware, socialmediacontroller.get_social_media);
systemrouter.route("/UpdateSocialMedia").put(authmiddleware.authmiddleware, socialmediacontroller.update_social_media);

// Misc Setting Routes
systemrouter.route("/GetMiscSetting").get(authmiddleware.authmiddleware, miscsettingcontroller.get_misc_setting);
systemrouter.route("/UpdateMiscSetting").put(authmiddleware.authmiddleware, miscsettingcontroller.update_misc_setting);

// Invoice Setting Routes
systemrouter.route("/GetInvoiceSetting").get(authmiddleware.authmiddleware, invoicesettingcontroller.get_invoice_setting);
systemrouter.route("/UpdateInvoiceSetting").put(authmiddleware.authmiddleware, invoicesettingcontroller.update_invoice_setting);

module.exports = systemrouter;
