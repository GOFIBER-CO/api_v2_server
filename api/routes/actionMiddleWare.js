const ActionModel = require("../../database/entities/ActionHistory");

async function createAction(actionName) {
  return (req, res, next) => {
    try {
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Có lỗi xảy ra" });
    }
  };
}

module.exports = createAction;
