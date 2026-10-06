const express = require("express");
const systemrouter = express.Router();
const currencycontroller = require("../../controllers/AdminPanel/System/currency-controller");
const taxcontroller = require("../../controllers/AdminPanel/System/tax-controller");
const metalcontroller = require("../../controllers/AdminPanel/System/metal-controller");
const fiscalyearcontroller = require("../../controllers/AdminPanel/System/Setting/fiscalyear-controller");
const generalsettingcontroller = require("../../controllers/AdminPanel/System/Setting/generalsetting-controller");
const socialmediacontroller = require("../../controllers/AdminPanel/System/Setting/socialmedia-controller");
const miscsettingcontroller = require("../../controllers/AdminPanel/System/Setting/miscsetting-controller");
const invoicesettingcontroller = require("../../controllers/AdminPanel/System/Setting/invoicesetting-controller");
const contactuscontroller = require("../../controllers/AdminPanel/System/contactus-controller");
const subscribercontroller = require("../../controllers/AdminPanel/System/subscriber-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

// Contact Us Routes
systemrouter.route("/GetContactUs").get(authMiddleware, contactuscontroller.get_contactus);
systemrouter.route("/AddContactUs").post(contactuscontroller.add_contactus);

// Newsletter Subscriber Routes
systemrouter.route("/SubscribeNewsletter").post(subscribercontroller.subscribe_newsletter);
systemrouter.route("/GetSubscribers").get(authMiddleware, subscribercontroller.get_subscribers);

// Currency Routes
systemrouter.route("/GetCurrencies").get(authMiddleware, currencycontroller.get_currency);
systemrouter.route("/GetCurrencies_statustrue").get(authMiddleware, currencycontroller.get_currency_with_statustrue);
systemrouter.route("/AddCurrency").post(authMiddleware, currencycontroller.addCurrency);
systemrouter.route("/EditCurrency/:currencyid").get(authMiddleware, currencycontroller.edit_currency);
systemrouter.route("/UpdateCurrency_status/:currencyid").put(authMiddleware, currencycontroller.updateCurrency_status);
systemrouter.route("/UpdateCurrency/:currencyid").put(authMiddleware, currencycontroller.updateCurrency);
systemrouter.route("/DeleteCurrency/:currencyid").delete(authMiddleware, currencycontroller.deletecurrency);

// Tax Routes
systemrouter.route("/GetTaxes").get(authMiddleware, taxcontroller.get_taxes);
systemrouter.route("/GetActiveTaxes").get(authMiddleware, taxcontroller.get_active_taxes);
systemrouter.route("/AddTax").post(authMiddleware, taxcontroller.add_tax);
systemrouter.route("/EditTax/:taxId").get(authMiddleware, taxcontroller.edit_tax);
systemrouter.route("/UpdateTaxStatus/:taxId").put(authMiddleware, taxcontroller.update_tax_status);
systemrouter.route("/UpdateTax/:taxId").put(authMiddleware, taxcontroller.update_tax);
systemrouter.route("/DeleteTax/:taxId").delete(authMiddleware, taxcontroller.delete_tax);

// Metal Routes
systemrouter.route("/GetMetals").get(authMiddleware, metalcontroller.get_metals);
systemrouter.route("/GetActiveMetals").get(metalcontroller.get_active_metals);
systemrouter.route("/AddMetal").post(authMiddleware, metalcontroller.add_metal);
systemrouter.route("/EditMetal/:metalid").get(authMiddleware, metalcontroller.edit_metal);
systemrouter.route("/UpdateMetalStatus/:metalid").put(authMiddleware, metalcontroller.update_metal_status);
systemrouter.route("/UpdateMetal/:metalid").put(authMiddleware, metalcontroller.update_metal);
systemrouter.route("/DeleteMetal/:metalid").delete(authMiddleware, metalcontroller.delete_metal);

// Fiscal Year Routes
systemrouter.route("/CheckCurrentFiscalYear").get(fiscalyearcontroller.check_current_fiscalyear);
systemrouter.route("/GetFiscalYear").get(authMiddleware, fiscalyearcontroller.get_fiscalyear);
systemrouter.route("/AddFiscalYear").post(authMiddleware, fiscalyearcontroller.add_fiscalyear);
systemrouter.route("/EditFiscalYear/:fiscalyearId").get(authMiddleware, fiscalyearcontroller.edit_fiscalyear);
systemrouter.route("/UpdateFiscalYear/:fiscalyearId").put(authMiddleware, fiscalyearcontroller.update_fiscalyear);
systemrouter.route("/DeleteFiscalYear/:fiscalyearId").delete(authMiddleware, fiscalyearcontroller.delete_fiscalyear);

// General Setting Routes
systemrouter.route("/GetGeneralSetting").get(authMiddleware, generalsettingcontroller.get_general_setting);
systemrouter.route("/GetGeneralSetting_landingpage").get(generalsettingcontroller.get_general_setting_for_landingpage);
systemrouter.route("/UpdateGeneralSetting").put(authMiddleware, generalsettingcontroller.update_general_setting);

// Social Media Routes
systemrouter.route("/GetSocialMedia").get(authMiddleware, socialmediacontroller.get_social_media);
systemrouter.route("/UpdateSocialMedia").put(authMiddleware, socialmediacontroller.update_social_media);

// Misc Setting Routes
systemrouter.route("/GetMiscSetting").get(authMiddleware, miscsettingcontroller.get_misc_setting);
systemrouter.route("/UpdateMiscSetting").put(authMiddleware, miscsettingcontroller.update_misc_setting);

// Invoice Setting Routes
systemrouter.route("/GetInvoiceSetting").get(authMiddleware, invoicesettingcontroller.get_invoice_setting);
systemrouter.route("/UpdateInvoiceSetting").put(authMiddleware, invoicesettingcontroller.update_invoice_setting);

module.exports = systemrouter;
