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

async function setActionStatus(actionId, actionName, actionStatus){
  try {
    const result = await ActionModel.findByIdAndUpdate(actionId, {
      action: actionName,
      status: actionStatus,
      successAt: new Date()
    })
  } catch (error) {
    console.log(error)
  }
}

exports.createAction = createAction;
exports.setActionStatus = setActionStatus
