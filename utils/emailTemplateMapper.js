// utils/emailTemplateMapper.js

const signupNotification = require("../templates/signupNotification");
const approvalEmail = require("../templates/signUpApprovalEmail");
const rejectionEmail = require("../templates/signUpRejectionEmail");
const artistApproval = require("../templates/artistApprovalEmail");
const artistRejection = require("../templates/artistRejectionEmail");
const eventApproval = require("../templates/eventApprovalEmail");
const eventRejection = require("../templates/eventRejectionEmail");

const EMAIL_TEMPLATES = {
    ARTIST_SIGNUP: signupNotification,
    ARTIST_APPROVED: approvalEmail,
    ARTIST_REJECTED: rejectionEmail,

    ARTIST_SUBMISSION_APPROVED: artistApproval,
    ARTIST_SUBMISSION_REJECTED: artistRejection,

    EVENT_APPROVED: eventApproval,
    EVENT_REJECTED: eventRejection,
};

module.exports = EMAIL_TEMPLATES;