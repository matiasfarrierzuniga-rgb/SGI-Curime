import Swal, { type SweetAlertIcon } from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

type ResultDialogOptions = {
  icon: SweetAlertIcon
  title: string
  text: string
  confirmButtonText: string
}

export function showResultDialog(options: ResultDialogOptions) {
  return Swal.fire({
    ...options,
    buttonsStyling: false,
    focusConfirm: true,
    heightAuto: false,
    returnFocus: true,
    customClass: {
      popup: 'sgi-result-dialog',
      title: 'sgi-result-dialog__title',
      htmlContainer: 'sgi-result-dialog__message',
      confirmButton: 'sgi-result-dialog__confirm',
    },
  })
}
