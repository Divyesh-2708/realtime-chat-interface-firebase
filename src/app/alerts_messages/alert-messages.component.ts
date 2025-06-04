import Swal from "sweetalert2";

export const showMessage = (title:string,msg:string,mode:any) => {
    Swal.fire({
        title : title,
        icon : mode,
        text : msg,
        timer:3000,
        timerProgressBar:true
    })
}