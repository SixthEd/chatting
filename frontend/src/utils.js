import axios from "axios";

const axioInst = axios.create({
    withCredentials:true,
    baseURL: "http://localhost:4000"});

export default axioInst;