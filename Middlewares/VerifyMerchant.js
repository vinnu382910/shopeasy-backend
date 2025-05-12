const Merchant = require("../Models/merchantDb");

const verifyMerchant = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized. User email not found." });
    }

    const email = req.user.email;
    const merchant = await Merchant.findOne({ email });

    if (!merchant) {
      return res.status(403).json({ message: "Merchant not found" });
    }

    if (!merchant.isVerified) {
      return res.status(403).json({ message: "Merchant is not verified" });
    }

    req.merchant = merchant;
    next();
  } catch (err) {
    console.error("Merchant verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = verifyMerchant;
