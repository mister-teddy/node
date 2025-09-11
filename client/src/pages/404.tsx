import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, type To } from "react-router-dom";

export default function NotFound(props: { noToast?: boolean }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!props.noToast) {
      toast.error("Page not found");
    }
    navigate(-1 as To, {
      viewTransition: true,
    });
  }, [navigate, props.noToast]);

  return <></>;
}
