document.addEventListener("DOMContentLoaded", function () {
  const toggles = document.querySelectorAll(".toggle-details");

  toggles.forEach(button => {
    button.addEventListener("click", () => {
      const courseItem = button.closest(".course-item");
      const details = courseItem.querySelector(".course-details");
      const isExpanded = button.getAttribute("aria-expanded") === "true";

      details.hidden = isExpanded;

      courseItem.querySelectorAll(".toggle-details").forEach(btn => {
        btn.setAttribute("aria-expanded", String(!isExpanded));
        btn.textContent = isExpanded ? "Read More" : "Read Less";
      });
    });
  });
});
