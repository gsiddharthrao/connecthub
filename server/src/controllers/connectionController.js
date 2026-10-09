const mongoose = require('mongoose');
const Connection = require('../models/Connection');
const User = require('../models/User');

// @desc    Send connection request
// @route   POST /api/connections/request
// @access  Protected
const sendRequest = async (req, res, next) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Recipient ID is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid recipient ID',
      });
    }

    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Cannot send connection request to yourself',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Recipient user not found',
      });
    }

    // Check existing connection
    const existing = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Already connected with this user',
        });
      }
      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'Connection request already pending',
        });
      }
      // If previously rejected, re-open
      existing.status = 'pending';
      existing.requester = req.user._id;
      existing.recipient = recipientId;
      await existing.save();

      const populated = await existing.populate('requester recipient', 'name email avatar');
      return res.status(201).json({
        success: true,
        connection: populated,
      });
    }

    const connection = await Connection.create({
      requester: req.user._id,
      recipient: recipientId,
      status: 'pending',
    });

    const populated = await connection.populate('requester recipient', 'name email avatar');

    res.status(201).json({
      success: true,
      connection: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept connection request
// @route   POST /api/connections/:id/accept or PUT /api/connections/accept/:id
// @access  Protected
const acceptRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid connection ID',
      });
    }

    const connection = await Connection.findById(id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Connection request not found',
      });
    }

    // Only the recipient can accept
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to accept this connection request',
      });
    }

    if (connection.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Connection request is already accepted',
      });
    }

    connection.status = 'accepted';
    await connection.save();

    await connection.populate('requester recipient', 'name email avatar');

    res.status(200).json({
      success: true,
      connection,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject connection request
// @route   POST /api/connections/:id/reject or PUT /api/connections/reject/:id
// @access  Protected
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid connection ID',
      });
    }

    const connection = await Connection.findById(id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'NotFoundError',
        message: 'Connection request not found',
      });
    }

    // Only recipient can reject
    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not authorized to reject this connection request',
      });
    }

    connection.status = 'rejected';
    await connection.save();

    res.status(200).json({
      success: true,
      message: 'Connection rejected',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get mutual accepted connections
// @route   GET /api/connections
// @access  Protected
const getConnections = async (req, res, next) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted',
    }).populate('requester recipient', 'name email avatar headline');

    res.status(200).json({
      success: true,
      count: connections.length,
      connections,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending connection requests (incoming and outgoing)
// @route   GET /api/connections/pending
// @access  Protected
const getPendingRequests = async (req, res, next) => {
  try {
    const incoming = await Connection.find({
      recipient: req.user._id,
      status: 'pending',
    }).populate('requester', 'name email avatar headline');

    const outgoing = await Connection.find({
      requester: req.user._id,
      status: 'pending',
    }).populate('recipient', 'name email avatar headline');

    res.status(200).json({
      success: true,
      incoming,
      outgoing,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get connection status with a specific user
// @route   GET /api/connections/status/:userId
// @access  Protected
const getConnectionStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        error: 'CastError',
        message: 'Invalid user ID',
      });
    }

    const connection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: userId },
        { requester: userId, recipient: req.user._id },
      ],
    });

    if (!connection) {
      return res.status(200).json({ success: true, status: 'none', connection: null });
    }

    if (connection.status === 'accepted') {
      return res.status(200).json({ success: true, status: 'accepted', connection });
    }

    if (connection.status === 'pending') {
      const isSent = connection.requester.toString() === req.user._id.toString();
      return res.status(200).json({
        success: true,
        status: isSent ? 'pending_sent' : 'pending_received',
        connection,
      });
    }

    res.status(200).json({ success: true, status: 'rejected', connection });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getConnections,
  getPendingRequests,
  getConnectionStatus,
};
