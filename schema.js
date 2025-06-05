const Joi = require('joi');

module.exports.userSchema = Joi.object({
        user: Joi.object({
        name: Joi.string().pattern(/^[a-zA-Z ]+$/).required(),
        username: Joi.string().required(),
        email: Joi.string().required(),
        profilePicture: Joi.string().allow("",null),
       }).required(),
       password: Joi.string().required(),
});