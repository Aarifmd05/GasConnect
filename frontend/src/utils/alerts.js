
import Swal from 'sweetalert2';

export const showSuccess = (message, title = 'Success!') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#0754A0'
  });
};

export const showError = (message, title = 'Error!') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonColor: '#0754A0'
  });
};

export const showWarning = (message, title = 'Warning!') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'warning',
    confirmButtonColor: '#FF9900'
  });
};

export const showInfo = (message, title = 'Information') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'info',
    confirmButtonColor: '#0754A0'
  });
};

export const showConfirm = (message, title = 'Are you sure?') => {
  return Swal.fire({
    title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Continue',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#0754A0',
    cancelButtonColor: '#64748b',
    reverseButtons: true
  });
};
