import axios from "axios";

const axioInst = axios.create({
    withCredentials:true,
    baseURL: "http://ec2-13-127-116-35.ap-south-1.compute.amazonaws.com:80/"});

export default axioInst;
