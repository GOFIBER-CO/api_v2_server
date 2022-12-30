const ActionModel = require("../../database/entities/ActionHistory");

function createAction(actionName) {
  return async (req, res, next) => {
    try {
      const action = await ActionModel.create({
        action: actionName,
        user: req.userId,
        createdAt: new Date(),
        status: 'pending',
      })
      req.actionId = action._id
      next();
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Có lỗi xảy ra" });
    }
  };
}

module.exports = createAction;
