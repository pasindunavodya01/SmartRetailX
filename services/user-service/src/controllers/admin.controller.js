const getAdminDashboard = async (req, res) => {
    res.status(200).json({
        message: 'Welcome to the admin dashboard',
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        }
    });
};

module.exports = {
    getAdminDashboard
};