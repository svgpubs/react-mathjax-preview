import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import DOMPurify from "dompurify";

const baseConfig = {
  showMathMenu: true,
  tex2jax: {
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
  },
  skipStartupTypeset: true,
};

const MathJaxPreview = ({
  script,
  config,
  className,
  math,
  id,
  style,
  msDelayDisplay, //milliseconds to delay display of div, 300 is default
}) => {
  const sanitizedMath = DOMPurify.sanitize(math);
  const previewRef = useRef();
  const [display, setDisplay] = useState("none"); //prevent display during processing
  const [loadingState, setLoadingState] = useState(
    window.MathJax ? "loaded" : "loading"
  );

  useEffect(() => {
    let mathjaxScriptTag = document.querySelector(`script[src="${script}"]`);
    if (!mathjaxScriptTag) {
      mathjaxScriptTag = document.createElement("script");
      mathjaxScriptTag.async = true;
      mathjaxScriptTag.src = script;

      for (const [k, v] of Object.entries(config || {})) {
        mathjaxScriptTag.setAttribute(k, v);
      }
      const node = document.head || document.getElementsByTagName("head")[0];
      node.appendChild(mathjaxScriptTag);
    }
    const onloadHandler = () => {
      setLoadingState("loaded");
      window.MathJax.Hub.Config({ ...baseConfig, ...config });
    };
    const onerrorHandler = () => {
      setLoadingState("failed");
    };

    mathjaxScriptTag.addEventListener("load", onloadHandler);
    mathjaxScriptTag.addEventListener("error", onerrorHandler);

    return () => {
      mathjaxScriptTag.removeEventListener("load", onloadHandler);
      mathjaxScriptTag.removeEventListener("error", onloadHandler);
    };
  }, [setLoadingState, config, baseConfig]);

  useEffect(() => {
    if (loadingState !== "loaded") {
      return;
    }
    previewRef.current.innerHTML = sanitizedMath;
    debugger;
    window.MathJax.Hub.Queue([
      "Typeset",
      window.MathJax.Hub,
      previewRef.current,
    ]);

    //delay display of div
    var msDelay;
    if ( //msDelayDisplay prop is a reasonable number of ms
      msDelayDisplay !== null &&
      !isNaN(+msDelayDisplay) &&
      +msDelayDisplay >= 0 &&
      +msDelayDisplay < 10000
    ) {
      msDelay = +msDelayDisplay;
    } else {
      msDelay = 300; // default 300ms delay
    }
    setTimeout(() => {
      setDisplay("inline"); //display div after delay, hopefully typeset has finished
    }, msDelay); 
    return () => {
      setDisplay("none");
    };
  }, [sanitizedMath, loadingState, previewRef]);
  return (
    <div className={className} id={id} style={{ display: display, ...style }}>
      {loadingState === "failed" && <span>fail loading mathjax lib</span>}
      <div className="react-mathjax-preview-result" ref={previewRef} />
    </div>
  );
};

MathJaxPreview.propTypes = {
  script: PropTypes.string,
  config: PropTypes.object,
  className: PropTypes.string,
  math: PropTypes.string,
  style: PropTypes.object,
  id: PropTypes.string,
};

MathJaxPreview.defaultProps = {
  script:
    "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.6/MathJax.js?config=TeX-MML-AM_HTMLorMML",
  id: "react-mathjax-preview",
};

export default MathJaxPreview;
