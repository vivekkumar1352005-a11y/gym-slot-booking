import ApiError from "../utils/ApiError";

const errorHandler = (err, req, res, next) => {

    if(err instanceof ApiError){
        return res.status(err.statusCode).json({
            success: err.success,
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors,
        })
    }

    console.error(err);
    
    return res.status(500).json({
        success: false,
        statusCode: 500,
        message: "Internal Server Error"
    })
}

export default errorHandler;