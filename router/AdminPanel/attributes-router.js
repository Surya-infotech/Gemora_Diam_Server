const express = require("express");
const attributesRouter = express.Router();
const metalcontroller = require("../../controllers/AdminPanel/Attributes/metal-controller");
const diamondsizecontroller = require("../../controllers/AdminPanel/Attributes/diamondsize-controller");
const ringsizecontroller = require("../../controllers/AdminPanel/Attributes/ringsize-controller");
const shapecontroller = require("../../controllers/AdminPanel/Attributes/shape-controller");
const claritycontroller = require("../../controllers/AdminPanel/Attributes/clarity-controller");
const colorcontroller = require("../../controllers/AdminPanel/Attributes/color-controller");
const stonecontroller = require("../../controllers/AdminPanel/Attributes/stone-controller");
const stylecontroller = require("../../controllers/AdminPanel/Attributes/style-controller");
const categorycontroller = require("../../controllers/AdminPanel/Attributes/category-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

// Metal Routes
attributesRouter.route("/GetMetals").get(authMiddleware, metalcontroller.get_metals);
attributesRouter.route("/GetActiveMetals").get(metalcontroller.get_active_metals);
attributesRouter.route("/AddMetal").post(authMiddleware, metalcontroller.add_metal);
attributesRouter.route("/EditMetal/:metalid").get(authMiddleware, metalcontroller.edit_metal);
attributesRouter.route("/UpdateMetalStatus/:metalid").put(authMiddleware, metalcontroller.update_metal_status);
attributesRouter.route("/UpdateMetal/:metalid").put(authMiddleware, metalcontroller.update_metal);
attributesRouter.route("/DeleteMetal/:metalid").delete(authMiddleware, metalcontroller.delete_metal);


// Diamond Size Routes
attributesRouter.route("/GetDiamondSizes").get(authMiddleware, diamondsizecontroller.get_diamond_sizes);
attributesRouter.route("/GetActiveDiamondSizes").get(diamondsizecontroller.get_active_diamond_sizes);
attributesRouter.route("/AddDiamondSize").post(authMiddleware, diamondsizecontroller.add_diamond_size);
attributesRouter.route("/EditDiamondSize/:diamondsizeid").get(authMiddleware, diamondsizecontroller.edit_diamond_size);
attributesRouter.route("/UpdateDiamondSizeStatus/:diamondsizeid").put(authMiddleware, diamondsizecontroller.update_diamond_size_status);
attributesRouter.route("/UpdateDiamondSize/:diamondsizeid").put(authMiddleware, diamondsizecontroller.update_diamond_size);
attributesRouter.route("/DeleteDiamondSize/:diamondsizeid").delete(authMiddleware, diamondsizecontroller.delete_diamond_size);


// Ring Size Routes
attributesRouter.route("/GetRingSizes").get(authMiddleware, ringsizecontroller.get_ring_sizes);
attributesRouter.route("/GetActiveRingSizes").get(ringsizecontroller.get_active_ring_sizes);
attributesRouter.route("/AddRingSize").post(authMiddleware, ringsizecontroller.add_ring_size);
attributesRouter.route("/EditRingSize/:ringsizeid").get(authMiddleware, ringsizecontroller.edit_ring_size);
attributesRouter.route("/UpdateRingSizeStatus/:ringsizeid").put(authMiddleware, ringsizecontroller.update_ring_size_status);
attributesRouter.route("/UpdateRingSize/:ringsizeid").put(authMiddleware, ringsizecontroller.update_ring_size);
attributesRouter.route("/DeleteRingSize/:ringsizeid").delete(authMiddleware, ringsizecontroller.delete_ring_size);


// Shape Routes
attributesRouter.route("/GetShapes").get(authMiddleware, shapecontroller.get_shapes);
attributesRouter.route("/GetActiveShapes").get(shapecontroller.get_active_shapes);
attributesRouter.route("/AddShape").post(authMiddleware, shapecontroller.add_shape);
attributesRouter.route("/EditShape/:shapeid").get(authMiddleware, shapecontroller.edit_shape);
attributesRouter.route("/UpdateShapeStatus/:shapeid").put(authMiddleware, shapecontroller.update_shape_status);
attributesRouter.route("/UpdateShape/:shapeid").put(authMiddleware, shapecontroller.update_shape);
attributesRouter.route("/DeleteShape/:shapeid").delete(authMiddleware, shapecontroller.delete_shape);


// Clarity Routes
attributesRouter.route("/GetClarities").get(authMiddleware, claritycontroller.get_clarities);
attributesRouter.route("/GetActiveClarities").get(claritycontroller.get_active_clarities);
attributesRouter.route("/AddClarity").post(authMiddleware, claritycontroller.add_clarity);
attributesRouter.route("/EditClarity/:clarityid").get(authMiddleware, claritycontroller.edit_clarity);
attributesRouter.route("/UpdateClarityStatus/:clarityid").put(authMiddleware, claritycontroller.update_clarity_status);
attributesRouter.route("/UpdateClarity/:clarityid").put(authMiddleware, claritycontroller.update_clarity);
attributesRouter.route("/DeleteClarity/:clarityid").delete(authMiddleware, claritycontroller.delete_clarity);



// Color Routes
attributesRouter.route("/GetColors").get(authMiddleware, colorcontroller.get_colors);
attributesRouter.route("/GetActiveColors").get(colorcontroller.get_active_colors);
attributesRouter.route("/AddColor").post(authMiddleware, colorcontroller.add_color);
attributesRouter.route("/EditColor/:colorid").get(authMiddleware, colorcontroller.edit_color);
attributesRouter.route("/UpdateColorStatus/:colorid").put(authMiddleware, colorcontroller.update_color_status);
attributesRouter.route("/UpdateColor/:colorid").put(authMiddleware, colorcontroller.update_color);
attributesRouter.route("/DeleteColor/:colorid").delete(authMiddleware, colorcontroller.delete_color);


// Stone Routes
attributesRouter.route("/GetStones").get(authMiddleware, stonecontroller.get_stones);
attributesRouter.route("/GetActiveStones").get(stonecontroller.get_active_stones);
attributesRouter.route("/AddStone").post(authMiddleware, stonecontroller.add_stone);
attributesRouter.route("/EditStone/:stoneid").get(authMiddleware, stonecontroller.edit_stone);
attributesRouter.route("/UpdateStoneStatus/:stoneid").put(authMiddleware, stonecontroller.update_stone_status);
attributesRouter.route("/UpdateStone/:stoneid").put(authMiddleware, stonecontroller.update_stone);
attributesRouter.route("/DeleteStone/:stoneid").delete(authMiddleware, stonecontroller.delete_stone);


// Style Routes
attributesRouter.route("/GetStyles").get(authMiddleware, stylecontroller.get_styles);
attributesRouter.route("/GetActiveStyles").get(stylecontroller.get_active_styles);
attributesRouter.route("/AddStyle").post(authMiddleware, stylecontroller.add_style);
attributesRouter.route("/EditStyle/:styleid").get(authMiddleware, stylecontroller.edit_style);
attributesRouter.route("/UpdateStyleStatus/:styleid").put(authMiddleware, stylecontroller.update_style_status);
attributesRouter.route("/UpdateStyle/:styleid").put(authMiddleware, stylecontroller.update_style);
attributesRouter.route("/DeleteStyle/:styleid").delete(authMiddleware, stylecontroller.delete_style);


// Category Routes
attributesRouter.route("/GetCategories").get(authMiddleware, categorycontroller.get_categories);
attributesRouter.route("/GetActiveCategories").get(categorycontroller.get_active_categories);
attributesRouter.route("/AddCategory").post(authMiddleware, categorycontroller.add_category);
attributesRouter.route("/EditCategory/:categoryid").get(authMiddleware, categorycontroller.edit_category);
attributesRouter.route("/UpdateCategoryStatus/:categoryid").put(authMiddleware, categorycontroller.update_category_status);
attributesRouter.route("/UpdateCategory/:categoryid").put(authMiddleware, categorycontroller.update_category);
attributesRouter.route("/DeleteCategory/:categoryid").delete(authMiddleware, categorycontroller.delete_category);

module.exports = attributesRouter;
