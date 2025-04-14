import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";


export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// export const updateProfile = async (req, res) => {
//   try {
//     const { profilePic } = req.body;
//     const userId = req.user._id;

//     if (!profilePic) {
//       return res.status(400).json({ message: "Profile pic is required" });
//     }

//     const uploadResponse = await cloudinary.uploader.upload(profilePic);
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { profilePic: uploadResponse.secure_url },
//       { new: true }
//     );

//     res.status(200).json(updatedUser);
//   } catch (error) {
//     console.log("error in update profile:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if files exist and have content
    if (!req.files || !req.files.profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }
    
    const file = req.files.profilePic;
    
    console.log("File info:", {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype,
      hasData: !!file.data,
      dataLength: file.data ? file.data.length : 0
    });
    // Validate that the file has data
    // if (!file.data || file.data.length === 0) {
    //   return res.status(400).json({ message: "Empty file received" });
    // }
    if (!file.tempFilePath) {
      return res.status(400).json({ message: "No temporary file path found" });
    }
    
    // Log file information for debugging
   
    
    // Use a Promise to handle the cloudinary upload
    // const uploadPromise = new Promise((resolve, reject) => {
    //   const uploadStream = cloudinary.uploader.upload_stream(
    //     { 
    //       resource_type: "image",
    //       folder: "profile_pics" 
    //     },
    //     (error, result) => {
    //       if (error) {
    //         console.error("Cloudinary Upload Error:", error);
    //         reject(error);
    //       } else {
    //         resolve(result);
    //       }
    //     }
    //   );
      
    //   uploadStream.end(file.data);
    // });
    
    // // Wait for the upload to complete
    // const uploadResponse = await uploadPromise;
    // console.log("Upload successful:", uploadResponse.secure_url);
    
    // // Then update the user profile
    // const updatedUser = await User.findByIdAndUpdate(
    //   userId,
    //   { profilePic: uploadResponse.secure_url },
    //   { new: true }
    // );
    
    // // Send only one response
    // res.status(200).json(updatedUser);
     // Use the temp file path for upload
      // Use the temp file path for upload
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath);
      console.log("Upload successful:", uploadResult.secure_url);
      
      // Update user profile
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: uploadResult.secure_url },
        { new: true }
      );
      return res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    
    // Send a more specific error message based on the error
    const errorMessage = error.message || "Internal server error";
    res.status(500).json({ message: errorMessage });
  }
};
// export const updateProfile = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     if (!req.files || !req.files.profilePic) {
//       return res.status(400).json({ message: "Profile pic is required" });
//     }

//     const file = req.files.profilePic;

//     // Wrap upload_stream in a Promise
//     const uploadToCloudinary = () => {
//       return new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           { resource_type: "image" },
//           (error, result) => {
//             if (error) return reject(error);
//             resolve(result);
//           }
//         );
//         stream.end(file.data);
//       });
//     };

//     const result = await uploadToCloudinary();

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { profilePic: result.secure_url },
//       { new: true }
//     );

//     return res.status(200).json(updatedUser);

//   } catch (error) {
//     console.error("Error in updateProfile:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };


export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
