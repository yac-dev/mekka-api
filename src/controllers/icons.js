import Icon from '../models/icon.js';

export const getIconByName = async (request, response) => {
  try {
    const icon = await Icon.findOne({ name: request.query.name });
    response.status(200).json({
      icon,
    });
  } catch (error) {
    console.log(error);
  }
};
