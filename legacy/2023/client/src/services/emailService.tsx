const API_URL = process.env.REACT_APP_API_URL; // original Azure App Service endpoint redacted
export async function sendEmail(data:any) {
    try{
        const response = await fetch(`${API_URL}/api/Email/SendEmail`,{
            method: 'POST',
            // headers: {'Content-Type':'multipart/form-data'},
            body:data
        })
        return await response.json;
    } catch(e){
        return 'Failed';
    }
}